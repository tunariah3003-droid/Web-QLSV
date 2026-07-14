const express = require("express");

const router = express.Router();

const db = require("../config/db");

const { addActivity } = require("../helpers/activity");

/*=========================================================
DANH SÁCH CHUYÊN NGÀNH
=========================================================*/

router.get("/majors", (req, res) => {
  const sql = `
    SELECT

      id,
      major_code,
      major_name,
      created_at

    FROM majors

    ORDER BY major_code ASC
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
CHI TIẾT CHUYÊN NGÀNH
=========================================================*/

router.get("/major/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    `
    SELECT

      id,
      major_code,
      major_name,
      created_at

    FROM majors

    WHERE id = ?
    `,
    [id],

    (err, result) => {
      if (err) {
        console.log(err);

        return res.status(500).send("Lỗi hệ thống");
      }

      if (result.length === 0) {
        return res.status(404).send("Không tìm thấy chuyên ngành");
      }

      res.json(result[0]);
    },
  );
});

/*=========================================================
THÊM CHUYÊN NGÀNH
=========================================================*/

router.post("/add-major", (req, res) => {
  let { major_code, major_name } = req.body;

  major_code = major_code?.trim().toUpperCase();

  major_name = major_name?.trim();

  if (!major_code || !major_name) {
    return res.send("Vui lòng nhập đầy đủ thông tin");
  }

  db.query(
    `
    SELECT id

    FROM majors

    WHERE major_code = ?
    `,
    [major_code],

    (err, result) => {
      if (err) {
        console.log(err);

        return res.send("Lỗi hệ thống");
      }

      if (result.length > 0) {
        return res.send("Mã chuyên ngành đã tồn tại");
      }

      db.query(
        `
        INSERT INTO majors
        (
          major_code,
          major_name
        )

        VALUES
        (
          ?,?
        )
        `,
        [major_code, major_name],

        (err, insertResult) => {
          if (err) {
            console.log(err);

            return res.send("Không thể thêm chuyên ngành");
          }

          addActivity(
            "Thêm chuyên ngành",
            `${major_code} - ${major_name}`,
            "major",
            null,
          );

          res.send("Thêm chuyên ngành thành công");
        },
      );
    },
  );
});

/*=========================================================
CẬP NHẬT CHUYÊN NGÀNH
=========================================================*/
router.post("/update-major", (req, res) => {
  let { id, major_code, major_name } = req.body;

  major_code = major_code?.trim().toUpperCase();

  major_name = major_name?.trim();

  if (!id || !major_code || !major_name) {
    return res.send("Vui lòng nhập đầy đủ thông tin");
  }

  db.query(
    `
    SELECT id

    FROM majors

    WHERE
      major_code = ?
    AND
      id <> ?
    `,
    [major_code, id],

    (err, result) => {
      if (err) {
        console.log(err);

        return res.send("Lỗi hệ thống");
      }

      if (result.length > 0) {
        return res.send("Mã chuyên ngành đã tồn tại");
      }

      db.query(
        `
        UPDATE majors

        SET
          major_code = ?,
          major_name = ?

        WHERE id = ?
        `,
        [major_code, major_name, id],

        (err) => {
          if (err) {
            console.log(err);

            return res.send("Không thể cập nhật chuyên ngành");
          }

          addActivity(
            "Cập nhật chuyên ngành",
            `${major_code} - ${major_name}`,
            "major",
            id,
          );

          res.send("Cập nhật chuyên ngành thành công");
        },
      );
    },
  );
});

/*=========================================================
XÓA CHUYÊN NGÀNH
=========================================================*/

router.post("/delete-major", (req, res) => {
  const { id } = req.body;

  db.query(
    `
    SELECT

      id,
      major_code,
      major_name

    FROM majors

    WHERE id = ?
    `,
    [id],

    (err, majorResult) => {
      if (err) {
        console.log(err);

        return res.send("Lỗi hệ thống");
      }

      if (majorResult.length === 0) {
        return res.send("Không tìm thấy chuyên ngành");
      }

      const major = majorResult[0];

      db.query(
        `
        SELECT id

        FROM classes

        WHERE major_id = ?

        LIMIT 1
        `,
        [id],

        (err, classResult) => {
          if (err) {
            console.log(err);

            return res.send("Lỗi hệ thống");
          }

          if (classResult.length > 0) {
            return res.send("Chuyên ngành đang được sử dụng, không thể xóa");
          }

          db.query(
            `
            DELETE FROM majors

            WHERE id = ?
            `,
            [id],

            (err) => {
              if (err) {
                console.log(err);

                return res.send("Không thể xóa chuyên ngành");
              }

              addActivity(
                "Xóa chuyên ngành",
                `${major.major_code} - ${major.major_name}`,
                "major",
                id,
              );

              res.send("Xóa chuyên ngành thành công");
            },
          );
        },
      );
    },
  );
});

/*=========================================================
EXPORT
=========================================================*/

module.exports = router;
