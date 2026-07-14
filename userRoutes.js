const express = require("express");

const router = express.Router();

const db = require("../config/db");

const { addActivity } = require("../helpers/activity");

/*=========================================================
CREATE USER
=========================================================*/

router.post("/create-user", (req, res) => {
  const {
    username,
    password,
    hoten,
    email,
    sodienthoai,

    role,

    nienkhoa,
    is_class_monitor,
  } = req.body;

  if (role === "admin") {
    return res.send("Không được tạo tài khoản Admin");
  }

  if (!username || !password || !hoten || !role) {
    return res.send("Vui lòng nhập đầy đủ thông tin");
  }

  db.query(
    `
    SELECT id
    FROM users
    WHERE username=?
    `,
    [username],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.send("Lỗi hệ thống");
      }

      if (result.length > 0) {
        return res.send("Tài khoản đã tồn tại");
      }

      db.query(
        `
        INSERT INTO users
        (
          username,
          password,
          hoten,
          email,
          sodienthoai,
          role
        )
        VALUES
        (
          ?,?,?,?,?,?
        )
        `,
        [username, password, hoten, email || "", sodienthoai || "", role],

        (err, userResult) => {
          if (err) {
            console.log(err);
            return res.send("Không thể tạo tài khoản");
          }

          const userId = userResult.insertId;

          /*=====================================================
          STUDENT
          =====================================================*/

          if (role === "student") {
            db.query(
              `
              INSERT INTO students
              (
                user_id,
                masv,
                nienkhoa,
                is_class_monitor
              )
              VALUES
              (
                ?,?,?,?
              )
              `,
              [userId, username, nienkhoa || "", is_class_monitor ? 1 : 0],

              (err) => {
                if (err) {
                  console.log(err);
                  return res.send("Không thể tạo sinh viên");
                }

                addActivity(
                  "Thêm sinh viên",
                  `${hoten} (${username})`,
                  "student",
                  userId,
                );

                return res.send("Tạo sinh viên thành công");
              },
            );

            return;
          }

          /*=====================================================
          TEACHER
          =====================================================*/

          if (role === "teacher") {
            db.query(
              `
              INSERT INTO teachers
              (
                user_id,
                magv
              )
              VALUES
              (
                ?,?
              )
              `,
              [userId, username],

              (err) => {
                if (err) {
                  console.log(err);
                  return res.send("Không thể tạo giảng viên");
                }

                addActivity(
                  "Thêm giáo viên",
                  `${hoten} (${username})`,
                  "teacher",
                  userId,
                );

                return res.send("Tạo giáo viên thành công");
              },
            );

            return;
          }

          addActivity(
            "Thêm tài khoản",
            `${hoten} (${username})`,
            "user",
            userId,
          );

          res.send("Tạo tài khoản thành công");
        },
      );
    },
  );
});

/*=========================================================
GET USERS
=========================================================*/
router.get("/users", (req, res) => {
  const sql = `
    SELECT
      id,
      username,
      hoten,
      email,
      sodienthoai,
      role,
      created_at
    FROM users
    ORDER BY id DESC
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
GET USER
=========================================================*/

router.get("/user/:username", (req, res) => {
  const { username } = req.params;

  const sql = `
    SELECT
      id,
      username,
      hoten,
      email,
      sodienthoai,
      role,
      avatar,
      ngaysinh,
      gioitinh,
      diachi,
      profile_completed,
      created_at
    FROM users
    WHERE username=?
  `;

  db.query(sql, [username], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Lỗi hệ thống");
    }

    if (result.length === 0) {
      return res.status(404).send("Không tìm thấy tài khoản");
    }

    res.json(result[0]);
  });
});

/*=========================================================
UPDATE USER
=========================================================*/

router.post("/update-user", (req, res) => {
  const { id, hoten, email, sodienthoai, ngaysinh, gioitinh, diachi } =
    req.body;

  db.query(
    `
    UPDATE users
    SET
      hoten=?,
      email=?,
      sodienthoai=?,
      ngaysinh=?,
      gioitinh=?,
      diachi=?,
      profile_completed=1
    WHERE id=?
    `,
    [
      hoten,
      email,
      sodienthoai,
      ngaysinh || null,
      gioitinh || null,
      diachi || "",
      id,
    ],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Không thể cập nhật");
      }

      addActivity("Cập nhật tài khoản", hoten, "user", id);

      res.send("Cập nhật thành công");
    },
  );
});

/*=========================================================
DELETE USER
=========================================================*/

router.post("/delete-user", (req, res) => {
  const { id } = req.body;

  db.query(
    `
    SELECT
      username,
      hoten
    FROM users
    WHERE id=?
    `,
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Lỗi hệ thống");
      }

      if (result.length === 0) {
        return res.send("Không tìm thấy tài khoản");
      }

      const user = result[0];

      db.query(
        `
        DELETE FROM users
        WHERE id=?
        `,
        [id],
        (err) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Không thể xóa tài khoản");
          }

          addActivity(
            "Xóa tài khoản",
            `${user.hoten} (${user.username})`,
            "user",
            id,
          );

          res.send("Xóa tài khoản thành công");
        },
      );
    },
  );
});

/*=========================================================
EXPORT
=========================================================*/

module.exports = router;
