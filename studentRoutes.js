const express = require("express");

const router = express.Router();

const db = require("../config/db");

/*=========================================================
DANH SÁCH SINH VIÊN
=========================================================*/

router.get("/students", (req, res) => {
  const sql = `
    SELECT

      s.id,
      s.user_id,
      s.masv,
      s.nienkhoa,
      s.is_class_monitor,

      c.id AS class_id,
      c.malop,
      c.tenlop,

      u.username,
      u.hoten,
      u.email,
      u.sodienthoai

    FROM students s

    JOIN users u
      ON s.user_id = u.id

    LEFT JOIN class_students cs
      ON cs.student_id = s.id

    LEFT JOIN classes c
      ON c.id = cs.class_id

    ORDER BY
      c.malop ASC,
      u.hoten ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Lỗi hệ thống");
    }

    res.json(result);
  });
});

/*=========================================================
DANH SÁCH SINH VIÊN THEO LỚP
=========================================================*/

router.get("/students/class/:classId", (req, res) => {
  const { classId } = req.params;

  const sql = `
    SELECT

      s.id,
      s.user_id,
      s.masv,
      s.nienkhoa,
      s.is_class_monitor,

      c.id AS class_id,
      c.malop,
      c.tenlop,

      u.username,
      u.hoten,
      u.email,
      u.sodienthoai

    FROM class_students cs

    JOIN students s
      ON s.id = cs.student_id

    JOIN users u
      ON u.id = s.user_id

    JOIN classes c
      ON c.id = cs.class_id

    WHERE c.id = ?

    ORDER BY u.hoten ASC
  `;

  db.query(sql, [classId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Lỗi hệ thống");
    }

    res.json(result);
  });
});

/*=========================================================
THÔNG TIN MỘT SINH VIÊN
=========================================================*/

router.get("/students/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT

      s.id,
      s.user_id,
      s.masv,
      s.nienkhoa,
      s.is_class_monitor,

      c.id AS class_id,
      c.malop,
      c.tenlop,

      u.username,
      u.hoten,
      u.email,
      u.sodienthoai,
      u.ngaysinh,
      u.gioitinh,
      u.diachi,
      u.avatar

    FROM students s

    JOIN users u
      ON s.user_id = u.id

    LEFT JOIN class_students cs
      ON cs.student_id = s.id

    LEFT JOIN classes c
      ON c.id = cs.class_id

    WHERE s.id = ?

    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Lỗi hệ thống");
    }

    if (result.length === 0) {
      return res.status(404).send("Không tìm thấy sinh viên");
    }

    res.json(result[0]);
  });
});

/*=========================================================
TÌM SINH VIÊN THEO MÃ
=========================================================*/

router.get("/students/code/:masv", (req, res) => {
  const { masv } = req.params;

  const sql = `
    SELECT

      s.id,
      s.user_id,
      s.masv,
      s.nienkhoa,
      s.is_class_monitor,

      c.id AS class_id,
      c.malop,
      c.tenlop,

      u.username,
      u.hoten,
      u.email,
      u.sodienthoai

    FROM students s

    JOIN users u
      ON u.id = s.user_id

    LEFT JOIN class_students cs
      ON cs.student_id = s.id

    LEFT JOIN classes c
      ON c.id = cs.class_id

    WHERE s.masv = ?

    LIMIT 1
  `;

  db.query(sql, [masv], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Lỗi hệ thống");
    }

    if (result.length === 0) {
      return res.status(404).send("Không tìm thấy sinh viên");
    }

    res.json(result[0]);
  });
});

module.exports = router;
