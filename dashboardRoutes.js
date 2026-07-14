const express = require("express");

const router = express.Router();

const {
  getStudentDashboard,

  getLeaderDashboard,
} = require("../helpers/dashboardHelper");

/*=========================================================
DASHBOARD SINH VIÊN
=========================================================*/

router.get("/student/:studentId", async (req, res) => {
  const { studentId } = req.params;

  if (!studentId) {
    return res.json({
      success: false,
      message: "Thiếu studentId",
    });
  }

  try {
    const data = await getStudentDashboard(studentId);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Không thể tải Dashboard sinh viên",
    });
  }
});

/*=========================================================
DASHBOARD LỚP TRƯỞNG
=========================================================*/

router.get("/leader/:studentId", async (req, res) => {
  const { studentId } = req.params;

  if (!studentId) {
    return res.json({
      success: false,
      message: "Thiếu studentId",
    });
  }

  try {
    const data = await getLeaderDashboard(studentId);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Không thể tải Dashboard lớp trưởng",
    });
  }
});

/*=========================================================
EXPORT
=========================================================*/

module.exports = router;
