const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");

const taskBetRefurn = require("../../services/BetRefurns");

module.exports = async () => {
  // Chạy ngay lần đầu khi khởi động
  console.log('Khởi động task hoàn trả cược...');
  await taskBetRefurn();
  
  // Chạy định kỳ mỗi 1 phút để cập nhật liên tục
  setInterval(async () => {
    const timeCheck = moment.tz('Asia/Ho_Chi_Minh').format("HH:mm:ss");
    console.log('Hoàn trả cược!', timeCheck);
    await taskBetRefurn();
  }, 60000);  //  1 phút (60000ms)
};