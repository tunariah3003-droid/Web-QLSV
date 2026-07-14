const express = require("express");

const router = express.Router();

const db = require("../config/db");

/*=========================================================
CHI TIẾT SINH VIÊN
=========================================================*/

router.get("/student-detail/:masv", (req, res) => {
  const { masv } = req.params;

  const sql = `
    SELECT

        s.id,

        s.user_id,

        s.masv,

        s.nienkhoa,

        s.chuyennganh,

        s.is_class_monitor,

        cs.class_id,

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
      ON u.id = s.user_id

    LEFT JOIN class_students cs
      ON cs.student_id = s.id

    LEFT JOIN classes c
      ON c.id = cs.class_id

    WHERE
        s.masv = ?

    LIMIT 1
  `;

  db.query(sql, [masv], (err, result) => {
    if (err) {
      console.log(err);

      return res.status(500).json({
        success: false,
        message: "Lỗi truy vấn.",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên.",
      });
    }

    res.json({
      success: true,
      data: result[0],
    });
  });
});

/*=========================================================
EXPORT
=========================================================*/

module.exports = router;
