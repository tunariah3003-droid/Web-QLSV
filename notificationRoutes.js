const express = require("express");

const router = express.Router();

const db = require("../config/db");

const fs = require("fs");

const path = require("path");

const multer = require("multer");
/*=========================================================
UPLOAD FOLDER
=========================================================*/

const ROOT = path.join(__dirname, "../uploads");

const NOTIFICATION = path.join(ROOT, "notifications");

const IMAGE = path.join(NOTIFICATION, "images");

const FILE = path.join(NOTIFICATION, "files");

if (!fs.existsSync(ROOT)) {
  fs.mkdirSync(ROOT);
}

if (!fs.existsSync(NOTIFICATION)) {
  fs.mkdirSync(NOTIFICATION);
}

if (!fs.existsSync(IMAGE)) {
  fs.mkdirSync(IMAGE);
}

if (!fs.existsSync(FILE)) {
  fs.mkdirSync(FILE);
}
/*=========================================================
IMAGE STORAGE
=========================================================*/

const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, IMAGE);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);

    cb(
      null,

      "IMG_" + Date.now() + "_" + Math.floor(Math.random() * 1000000) + ext,
    );
  },
});
/*=========================================================
FILE STORAGE
=========================================================*/

const fileStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, FILE);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);

    cb(
      null,

      "FILE_" + Date.now() + "_" + Math.floor(Math.random() * 1000000) + ext,
    );
  },
});
/*=========================================================
IMAGE FILTER
=========================================================*/

function imageFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  const allow = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  if (!allow.includes(ext)) {
    return cb(new Error("Ảnh không hợp lệ"));
  }

  cb(null, true);
}
/*=========================================================
FILE FILTER
=========================================================*/

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  const allow = [
    ".pdf",

    ".doc",

    ".docx",

    ".xls",

    ".xlsx",

    ".ppt",

    ".pptx",

    ".zip",

    ".rar",
  ];

  if (!allow.includes(ext)) {
    return cb(new Error("File không hợp lệ"));
  }

  cb(null, true);
}
/*=========================================================
UPLOAD
=========================================================*/

const uploadImage = multer({
  storage: imageStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: imageFilter,
});

const uploadFile = multer({
  storage: fileStorage,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: fileFilter,
});
/*=========================================================
UPLOAD IMAGE
=========================================================*/

router.post(
  "/notification/upload/image",

  uploadImage.single("image"),

  (req, res) => {
    if (!req.file) {
      return res.json({
        success: false,

        message: "Không có ảnh",
      });
    }

    res.json({
      success: true,

      image: req.file.filename,

      url: "/uploads/notifications/images/" + req.file.filename,
    });
  },
);
/*=========================================================
UPLOAD FILE
=========================================================*/

router.post(
  "/notification/upload/file",

  uploadFile.single("file"),

  (req, res) => {
    if (!req.file) {
      return res.json({
        success: false,

        message: "Không có file",
      });
    }

    res.json({
      success: true,

      file: req.file.filename,

      fileName: req.file.originalname,

      url: "/uploads/notifications/files/" + req.file.filename,
    });
  },
);
/*=========================================================
INSERT NOTIFICATION
=========================================================*/

function insertNotification(data) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      INSERT INTO notifications
      (
          title,
          content,
          image,
          attachment,
          attachment_name,
          link,
          created_by
      )
      VALUES
      (?,?,?,?,?,?,?)
      `,
      [
        data.title,
        data.content,
        data.image,
        data.attachment,
        data.attachment_name,
        data.link,
        data.created_by,
      ],
      (err, result) => {
        if (err) return reject(err);

        resolve(result.insertId);
      },
    );
  });
}
/*=========================================================
SAVE NOTIFICATION CLASS
=========================================================*/

function saveNotificationClass(notificationId, classId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      INSERT INTO notification_classes
      (
          notification_id,
          class_id
      )
      VALUES
      (?,?)
      `,
      [notificationId, classId],
      (err) => {
        if (err) return reject(err);

        resolve(true);
      },
    );
  });
}
/*=========================================================
CREATE NOTIFICATION
=========================================================*/

router.post("/notification", async (req, res) => {
  try {
    const {
      title,
      content,
      image,
      attachment,
      attachment_name,
      link,
      created_by,
      role,
      classIds,
      studentId,
    } = req.body;

    if (!title) {
      return res.json({
        success: false,
        message: "Vui lòng nhập tiêu đề.",
      });
    }

    if (!content) {
      return res.json({
        success: false,
        message: "Vui lòng nhập nội dung.",
      });
    }

    const notificationId = await insertNotification({
      title,
      content,
      image: image || null,
      attachment: attachment || null,
      attachment_name: attachment_name || null,
      link: link || null,
      created_by,
    });

    /*=====================================================
        ADMIN
    =====================================================*/

    if (role === "admin") {
      if (!classIds || classIds.length === 0) {
        await saveNotificationClass(notificationId, null);
      } else {
        for (const classId of classIds) {
          await saveNotificationClass(notificationId, classId);
        }
      }
    } else if (role === "teacher") {
      /*=====================================================
        TEACHER
    =====================================================*/
      for (const classId of classIds) {
        await saveNotificationClass(notificationId, classId);
      }
    } else if (role === "student") {
      /*=====================================================
        LEADER
    =====================================================*/
      const leader = await new Promise((resolve, reject) => {
        db.query(
          `
          SELECT
              class_id
          FROM class_students
          WHERE student_id=?
          LIMIT 1
          `,
          [studentId],
          (err, result) => {
            if (err) return reject(err);

            resolve(result[0]);
          },
        );
      });

      if (leader) {
        await saveNotificationClass(notificationId, leader.class_id);
      }
    }

    res.json({
      success: true,
      message: "Đăng thông báo thành công.",
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,
      message: "Lỗi hệ thống.",
    });
  }
});
/*=========================================================
GET NOTIFICATIONS
=========================================================*/

function getNotifications(role, classId, page = 1, limit = 20) {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    let sql = `
      SELECT DISTINCT

          n.id,

          n.title,

          n.content,

          n.image,

          n.attachment,

          n.attachment_name,

          n.link,

          n.created_at,

          u.hoten AS sender

      FROM notifications n

      JOIN users u
        ON u.id = n.created_by

      LEFT JOIN notification_classes nc
        ON nc.notification_id = n.id
    `;

    const params = [];

    /*=====================================================
    ADMIN
    =====================================================*/

    if (role !== "admin") {
      if (classId) {
        sql += `
          WHERE
              nc.class_id IS NULL
          OR
              nc.class_id = ?
        `;

        params.push(classId);
      }
    }

    sql += `
      ORDER BY
          n.created_at DESC

      LIMIT ?

      OFFSET ?
    `;

    params.push(Number(limit));
    params.push(Number(offset));

    db.query(sql, params, (err, result) => {
      if (err) return reject(err);

      resolve(result);
    });
  });
}
/*=========================================================
GET LIST
=========================================================*/

router.get("/notification", async (req, res) => {
  try {
    const role = req.query.role || "student";

    const classId = req.query.classId || null;

    const page = Number(req.query.page || 1);

    const limit = Number(req.query.limit || 20);

    const total = await countNotifications(role, classId);

    const data = await getNotifications(role, classId, page, limit);

    const totalPage = Math.ceil(total / limit);

    res.json({
      success: true,

      page,

      limit,

      total,

      totalPage,

      data,
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,

      message: "Lỗi hệ thống",
    });
  }
});
/*=========================================================
GET DETAIL
=========================================================*/

function getNotificationDetail(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT

          n.*,

          u.hoten AS sender

      FROM notifications n

      LEFT JOIN users u
          ON u.id = n.created_by

      WHERE

          n.id=?

      LIMIT 1
      `,
      [id],
      (err, result) => {
        if (err) return reject(err);

        resolve(result[0]);
      },
    );
  });
}
/*=========================================================
GET CLASS RECEIVER
=========================================================*/

function getNotificationClasses(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT

          c.id,

          c.malop,

          c.tenlop

      FROM notification_classes nc

      LEFT JOIN classes c
          ON c.id=nc.class_id

      WHERE

          nc.notification_id=?
      `,
      [id],
      (err, result) => {
        if (err) return reject(err);

        resolve(result);
      },
    );
  });
}
/*=========================================================
DETAIL
=========================================================*/

router.get("/notification/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const notification = await getNotificationDetail(id);

    if (!notification) {
      return res.json({
        success: false,
        message: "Không tìm thấy thông báo.",
      });
    }

    const classes = await getNotificationClasses(id);

    res.json({
      success: true,

      data: notification,

      classes,
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,

      message: "Lỗi hệ thống.",
    });
  }
});
/*=========================================================
UPDATE NOTIFICATION
=========================================================*/

function updateNotification(id, data) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      UPDATE notifications

      SET

          title=?,

          content=?,

          image=?,

          attachment=?,

          attachment_name=?,

          link=?

      WHERE

          id=?
      `,
      [
        data.title,

        data.content,

        data.image,

        data.attachment,

        data.attachment_name,

        data.link,

        id,
      ],
      (err) => {
        if (err) return reject(err);

        resolve(true);
      },
    );
  });
}
/*=========================================================
DELETE NOTIFICATION CLASSES
=========================================================*/

function deleteNotificationClasses(notificationId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      DELETE FROM notification_classes

      WHERE

          notification_id=?
      `,
      [notificationId],
      (err) => {
        if (err) return reject(err);

        resolve(true);
      },
    );
  });
}
/*=========================================================
UPDATE
=========================================================*/

router.put("/notification/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const {
      title,
      content,
      image,
      attachment,
      attachment_name,
      link,
      role,
      classIds,
      studentId,
    } = req.body;

    await updateNotification(id, {
      title,

      content,

      image,

      attachment,

      attachment_name,

      link,
    });

    await deleteNotificationClasses(id);

    /*=========================================
        ADMIN
    =========================================*/

    if (role === "admin") {
      if (!classIds || classIds.length === 0) {
        await saveNotificationClass(id, null);
      } else {
        for (const classId of classIds) {
          await saveNotificationClass(id, classId);
        }
      }
    } else if (role === "teacher") {
      /*=========================================
        TEACHER
    =========================================*/
      for (const classId of classIds) {
        await saveNotificationClass(id, classId);
      }
    } else if (role === "student") {
      /*=========================================
        LEADER
    =========================================*/
      const leader = await new Promise((resolve, reject) => {
        db.query(
          `
          SELECT

              class_id

          FROM class_students

          WHERE

              student_id=?

          LIMIT 1
          `,
          [studentId],
          (err, result) => {
            if (err) return reject(err);

            resolve(result[0]);
          },
        );
      });

      if (leader) {
        await saveNotificationClass(id, leader.class_id);
      }
    }

    res.json({
      success: true,

      message: "Cập nhật thành công.",
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,

      message: "Lỗi hệ thống.",
    });
  }
});
/*=========================================================
DELETE FILE
=========================================================*/

function removeFile(filePath) {
  if (!filePath) return;

  const fullPath = path.join(__dirname, "..", filePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}
/*=========================================================
DELETE NOTIFICATION
=========================================================*/

function deleteNotification(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      DELETE FROM notifications

      WHERE id=?
      `,
      [id],
      (err) => {
        if (err) return reject(err);

        resolve(true);
      },
    );
  });
}
/*=========================================================
DELETE
=========================================================*/

router.delete("/notification/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const notification = await getNotificationDetail(id);

    if (!notification) {
      return res.json({
        success: false,
        message: "Thông báo không tồn tại.",
      });
    }

    /*=========================================
        XÓA ẢNH
    =========================================*/

    removeFile(notification.image);

    /*=========================================
        XÓA FILE
    =========================================*/

    removeFile(notification.attachment);

    /*=========================================
        XÓA DANH SÁCH LỚP
    =========================================*/

    await deleteNotificationClasses(id);

    /*=========================================
        XÓA THÔNG BÁO
    =========================================*/

    await deleteNotification(id);

    res.json({
      success: true,
      message: "Đã xóa thông báo.",
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,
      message: "Lỗi hệ thống.",
    });
  }
});
/*=========================================================
COUNT NOTIFICATIONS
=========================================================*/

function countNotifications(role, classId) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT

          COUNT(DISTINCT n.id) AS total

      FROM notifications n

      LEFT JOIN notification_classes nc
        ON nc.notification_id = n.id
    `;

    const params = [];

    /*=====================================================
    ADMIN
    =====================================================*/

    if (role !== "admin") {
      if (classId) {
        sql += `
          WHERE
              nc.class_id IS NULL
          OR
              nc.class_id = ?
        `;

        params.push(classId);
      }
    }

    db.query(sql, params, (err, result) => {
      if (err) return reject(err);

      resolve(result[0].total);
    });
  });
}
/*=========================================================
GET DASHBOARD
=========================================================*/

function getDashboard() {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT

          COUNT(*) AS totalNotification,

          SUM(DATE(created_at)=CURDATE()) AS todayNotification,

          SUM(image IS NOT NULL AND image<>'') AS imageNotification,

          SUM(attachment IS NOT NULL AND attachment<>'') AS fileNotification

      FROM notifications
      `,
      (err, result) => {
        if (err) return reject(err);

        resolve(result[0]);
      },
    );
  });
}
/*=========================================================
DASHBOARD
=========================================================*/

router.get("/dashboard", async (req, res) => {
  try {
    const dashboard = await getDashboard();

    res.json({
      success: true,
      ...dashboard,
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,
      message: "Không tải được Dashboard.",
    });
  }
});
/*=========================================================
GET CLASSES
=========================================================*/

function getClasses(teacherId, role) {
  return new Promise((resolve, reject) => {
    let sql = `

            SELECT

                id,

                malop,

                tenlop

            FROM classes

        `;

    const params = [];

    if (role === "teacher") {
      sql += `

                WHERE teacher_id=?

            `;

      params.push(teacherId);
    }

    sql += `

            ORDER BY tenlop

        `;

    db.query(
      sql,

      params,

      (err, result) => {
        if (err) {
          return reject(err);
        }

        resolve(result);
      },
    );
  });
}
/*=========================================================
GET CLASS LIST
=========================================================*/

router.get("/class/:teacherId", async (req, res) => {
  try {
    const teacherId = Number(req.params.teacherId);

    const role = req.query.role || "teacher";

    const data = await getClasses(
      teacherId,

      role,
    );

    res.json({
      success: true,

      data,
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,

      message: "Không tải được lớp.",
    });
  }
});
/*=========================================================
GET CLASS
=========================================================*/

function getClasses(teacherId, role) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT

          id,

          malop,

          tenlop

      FROM classes
    `;

    const params = [];

    if (role === "teacher") {
      sql += `
        WHERE teacher_id=?
      `;

      params.push(teacherId);
    }

    sql += `
      ORDER BY tenlop
    `;

    db.query(sql, params, (err, result) => {
      if (err) return reject(err);

      resolve(result);
    });
  });
}
/*=========================================================
CLASS
=========================================================*/

router.get("/notification/classes/:teacherId", async (req, res) => {
  try {
    const teacherId = Number(req.params.teacherId);

    const role = req.query.role || "teacher";

    const data = await getClasses(teacherId, role);

    res.json({
      success: true,

      data,
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,

      message: "Không tải được danh sách lớp.",
    });
  }
});
module.exports = router;
