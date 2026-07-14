const express = require("express");

const router = express.Router();

const db = require("../config/db");

const bcrypt = require("bcrypt");

/*=========================================================
GET PROFILE
=========================================================*/

router.get("/profile/:username", (req, res) => {
  const { username } = req.params;

  const sql = `

    SELECT

        u.id,
        u.username,
        u.hoten,
        u.email,
        u.sodienthoai,
        u.role,
        u.ngaysinh,
        u.gioitinh,
        u.diachi,
        u.avatar,
        u.profile_completed,

        t.id teacher_id,
        t.magv,

        s.id student_id,
        s.masv,
        s.nienkhoa,
        s.chuyennganh,
        s.is_class_monitor,

        c.id class_id,
        c.malop,
        c.tenlop,

        m.id major_id,
        m.major_name

    FROM users u

    LEFT JOIN teachers t

        ON t.user_id=u.id

    LEFT JOIN students s

        ON s.user_id=u.id

    LEFT JOIN class_students cs

        ON cs.student_id=s.id

    LEFT JOIN classes c

        ON c.id=cs.class_id

    LEFT JOIN majors m

        ON m.id=c.major_id

    WHERE

        u.username=?

    LIMIT 1

    `;

  db.query(sql, [username], (err, result) => {
    if (err) {
      console.log(err);

      return res.json({
        success: false,

        message: "Không tải được hồ sơ.",
      });
    }

    if (result.length === 0) {
      return res.json({
        success: false,

        message: "Không tìm thấy người dùng.",
      });
    }

    res.json({
      success: true,

      data: result[0],
    });
  });
});

/*=========================================================
UPDATE PROFILE
=========================================================*/

router.post("/profile/update", (req, res) => {
  const {
    username,

    email,

    sodienthoai,

    ngaysinh,

    gioitinh,

    diachi,

    avatar,
  } = req.body;

  db.query(
    `

        UPDATE users

        SET

            email=?,

            sodienthoai=?,

            ngaysinh=?,

            gioitinh=?,

            diachi=?,

            avatar=?,

            profile_completed=1

        WHERE

            username=?

        `,

    [email, sodienthoai, ngaysinh, gioitinh, diachi, avatar, username],

    (err) => {
      if (err) {
        console.log(err);

        return res.json({
          success: false,

          message: "Không cập nhật được.",
        });
      }

      res.json({
        success: true,

        message: "Cập nhật thành công.",
      });
    },
  );
});

console.log("Profile Route Loaded");
/*=========================================================
CHANGE PASSWORD
=========================================================*/

router.post("/profile/change-password", (req, res) => {
  const { username, oldPassword, newPassword, confirmPassword } = req.body;

  if (!username || !oldPassword || !newPassword || !confirmPassword) {
    return res.json({
      success: false,
      message: "Nhập đầy đủ thông tin.",
    });
  }

  if (newPassword.length < 6) {
    return res.json({
      success: false,
      message: "Mật khẩu mới tối thiểu 6 ký tự.",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.json({
      success: false,
      message: "Nhập lại mật khẩu không đúng.",
    });
  }

  db.query(
    `
    SELECT
      id,
      password
    FROM users
    WHERE username = ?
    LIMIT 1
    `,
    [username],
    (err, result) => {
      if (err) {
        console.log(err);

        return res.json({
          success: false,
          message: "Lỗi hệ thống.",
        });
      }

      if (result.length === 0) {
        return res.json({
          success: false,
          message: "Không tìm thấy tài khoản.",
        });
      }

      const user = result[0];

      if (oldPassword.trim() !== String(user.password).trim()) {
        return res.json({
          success: false,
          message: "Mật khẩu cũ không đúng.",
        });
      }

      if (oldPassword.trim() === newPassword.trim()) {
        return res.json({
          success: false,
          message: "Mật khẩu mới phải khác mật khẩu cũ.",
        });
      }

      db.query(
        `
        UPDATE users
        SET password = ?
        WHERE id = ?
        `,
        [newPassword.trim(), user.id],
        (err) => {
          if (err) {
            console.log(err);

            return res.json({
              success: false,
              message: "Không đổi được mật khẩu.",
            });
          }

          res.json({
            success: true,
            message: "Đổi mật khẩu thành công.",
          });
        },
      );
    },
  );
});

/*=========================================================
UPLOAD AVATAR
=========================================================*/

const fs = require("fs");

const path = require("path");

const multer = require("multer");

const AVATAR = path.join(__dirname, "../uploads/avatar");

if (!fs.existsSync(AVATAR)) {
  fs.mkdirSync(AVATAR, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, AVATAR);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);

    cb(
      null,

      "AVATAR_" + Date.now() + "_" + Math.floor(Math.random() * 1000000) + ext,
    );
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter(req, file, cb) {
    const ext = path

      .extname(file.originalname)

      .toLowerCase();

    const allow = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    if (!allow.includes(ext)) {
      return cb(new Error("Ảnh không hợp lệ."));
    }

    cb(null, true);
  },
});

/*=========================================================
UPLOAD AVATAR API
=========================================================*/

router.post(
  "/profile/avatar",

  uploadAvatar.single("avatar"),

  (req, res) => {
    if (!req.file) {
      return res.json({
        success: false,

        message: "Không có ảnh.",
      });
    }

    const { username } = req.body;

    db.query(
      `

            SELECT avatar

            FROM users

            WHERE username=?

            LIMIT 1

            `,

      [username],

      (err, result) => {
        if (!err && result.length) {
          const oldAvatar = result[0].avatar;

          if (oldAvatar && oldAvatar.startsWith("/uploads/avatar/")) {
            const oldPath = path.join(
              __dirname,

              "..",

              oldAvatar,
            );

            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
        }

        const avatar = "/uploads/avatar/" + req.file.filename;

        db.query(
          `

                    UPDATE users

                    SET avatar=?

                    WHERE username=?

                    `,

          [avatar, username],

          (err) => {
            if (err) {
              console.log(err);

              return res.json({
                success: false,

                message: "Không cập nhật được avatar.",
              });
            }

            res.json({
              success: true,

              avatar,

              message: "Cập nhật avatar thành công.",
            });
          },
        );
      },
    );
  },
);

console.log("Avatar Upload Loaded");
/*=========================================================
GET USER CLASSES
=========================================================*/

router.get("/profile/classes/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    `

        SELECT

            c.id,

            c.malop,

            c.tenlop,

            m.major_name,

            t2.hoten teacher_name

        FROM users u

        LEFT JOIN teachers t

            ON t.user_id=u.id

        LEFT JOIN students s

            ON s.user_id=u.id

        LEFT JOIN class_students cs

            ON cs.student_id=s.id

        LEFT JOIN classes c

            ON

            (

                c.teacher_id=t.id

                OR

                c.id=cs.class_id

            )

        LEFT JOIN majors m

            ON m.id=c.major_id

        LEFT JOIN teachers gt

            ON gt.id=c.teacher_id

        LEFT JOIN users t2

            ON t2.id=gt.user_id

        WHERE

            u.id=?

        GROUP BY

            c.id

        ORDER BY

            c.tenlop

        `,

    [userId],

    (err, result) => {
      if (err) {
        console.log(err);

        return res.json({
          success: false,

          message: "Không tải được lớp.",
        });
      }

      res.json({
        success: true,

        data: result,
      });
    },
  );
});

/*=========================================================
CHECK PROFILE
=========================================================*/

router.get("/profile/check/:username", (req, res) => {
  db.query(
    `

        SELECT

            profile_completed

        FROM users

        WHERE username=?

        LIMIT 1

        `,

    [req.params.username],

    (err, result) => {
      if (err) {
        return res.json({
          success: false,
        });
      }

      if (!result.length) {
        return res.json({
          success: false,
        });
      }

      res.json({
        success: true,

        completed: result[0].profile_completed === 1,
      });
    },
  );
});

/*=========================================================
DELETE AVATAR
=========================================================*/

router.delete("/profile/avatar/:username", (req, res) => {
  const { username } = req.params;

  db.query(
    `

        SELECT avatar

        FROM users

        WHERE username=?

        LIMIT 1

        `,

    [username],

    (err, result) => {
      if (err || !result.length) {
        return res.json({
          success: false,
        });
      }

      const avatar = result[0].avatar;

      if (avatar && avatar.startsWith("/uploads/avatar/")) {
        const filePath = path.join(
          __dirname,

          "..",

          avatar,
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      db.query(
        `

                UPDATE users

                SET avatar=NULL

                WHERE username=?

                `,

        [username],

        (err) => {
          if (err) {
            return res.json({
              success: false,

              message: "Không xóa được avatar.",
            });
          }

          res.json({
            success: true,

            message: "Đã xóa avatar.",
          });
        },
      );
    },
  );
});

/*=========================================================
EXPORT
=========================================================*/

module.exports = router;
