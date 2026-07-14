const express = require("express");

const router = express.Router();

const {
  getTeacherDashboard,
  getTeacherClasses,
  getWaitingStudents,
} = require("../helpers/dashboardTeacherHelper");

/*=========================================================
DASHBOARD GIẢNG VIÊN
=========================================================*/

router.get("/:teacherId", async (req, res) => {
  try {
    const data = await getTeacherDashboard(req.params.teacherId);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Không thể tải Dashboard",
    });
  }
});

/*=========================================================
DANH SÁCH LỚP CHỦ NHIỆM
=========================================================*/

router.get("/:teacherId/classes", async (req, res) => {
  try {
    const data = await getTeacherClasses(req.params.teacherId);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Không thể tải danh sách lớp",
    });
  }
});

/*=========================================================
EXPORT
=========================================================*/

module.exports = router;
