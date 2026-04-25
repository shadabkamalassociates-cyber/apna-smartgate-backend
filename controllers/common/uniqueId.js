const generateSmartGateId = (role) => {
    const rolePrefix = {
      secretary: "SEC",
      admin: "ADM",
      user: "USR",
      guard: "GRD",
      vendor: "VND",
    };
  
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
  
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  
    return `${rolePrefix[role] || "USR"}-${randomPart}`;
  };

  module.exports = { generateSmartGateId };