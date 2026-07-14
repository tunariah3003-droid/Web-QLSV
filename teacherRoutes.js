const express = require("express");

const router = express.Router();

const db = require("../config/db");

const { addActivity } = require("../helpers/activity");

/*=========================================================
DANH SÁCH GIẢNG VIÊN
=========================================================*/

router.get("/teachers", (req, res) => {
  const sql = `
    SELECT

      t.id,
      t.magv,

      u.id AS user_id,
      u.username,
      u.hoten,
      u.email,
      u.sodienthoai

    FROM teachers t

    JOIN users u
      ON u.id = t.user_id

    ORDER BY t.magv ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    res.json(result);
  });
});

/*=========================================================
CHI TIẾT GIẢNG VIÊN
=========================================================*/

router.get("/teacher/:magv", (req, res) => {
  const { magv } = req.params;

  const sql = `
    SELECT

      t.id,
      t.magv,

      u.id AS user_id,
      u.username,
      u.hoten,
      u.email,
      u.sodienthoai,
      u.ngaysinh,
      u.gioitinh,
      u.diachi,
      u.avatar

    FROM teachers t

    JOIN users u
      ON u.id = t.user_id

    WHERE t.magv = ?

    LIMIT 1
  `;

  db.query(sql, [magv], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    if (result.length === 0) {
      return res.status(404).send("Không tìm thấy giảng viên");
    }

    res.json(result[0]);
  });
});

/*=========================================================
XÓA GIẢNG VIÊN
=========================================================*/

router.post("/delete-teacher", (req, res) => {
  const { magv } = req.body;

  if (!magv) {
    return res.send("Thiếu mã giảng viên");
  }

  const teacherSql = `
    SELECT

      t.id,
      t.user_id,
      t.magv,

      u.hoten

    FROM teachers t

    JOIN users u
      ON u.id = t.user_id

    WHERE t.magv = ?
  `;

  db.query(teacherSql, [magv], (err, teacherResult) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Lỗi hệ thống");
    }

    if (teacherResult.length === 0) {
      return res.send("Không tìm thấy giảng viên");
    }

    const teacher = teacherResult[0];

    /*=====================================================
      KIỂM TRA CHỦ NHIỆM
    =====================================================*/

    db.query(
      `
      SELECT id
      FROM classes
      WHERE teacher_id = ?
      LIMIT 1
      `,
      [teacher.id],

      (err, classResult) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Lỗi hệ thống");
        }

        if (classResult.length > 0) {
          return res.send(
            "Giảng viên đang là giáo viên chủ nhiệm, không thể xóa.",
          );
        }

        /*=================================================
          XÓA USER
          teachers sẽ tự xóa do ON DELETE CASCADE
        =================================================*/

        db.query(
          `
          DELETE FROM users
          WHERE id = ?
          `,
          [teacher.user_id],

          (err) => {
            if (err) {
              console.log(err);
              return res.status(500).send("Không thể xóa giảng viên");
            }

            addActivity(
              "Xóa giảng viên",
              `${teacher.magv} - ${teacher.hoten}`,
              "teacher",
              teacher.user_id,
            );

            res.send("Xóa giảng viên thành công");
          },
        );
      },
    );
  });
});

module.exports = router;
