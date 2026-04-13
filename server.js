const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const { client } = require('./config/client')
const cookiesParser = require('cookie-parser')
const cors = require("cors");
const path = require("path");
const residentsRouter = require('./routers/residents')
const routerGuards = require('./routers/guards')
const adminRouter = require('./routers/admin.routes')
const apartmentRouter = require('./routers/apartments')
const societiesRouter = require('./routers/societies')
const complaintsRouter = require('./routers/complaints')
const { visitorsRouter } = require('./routers/visitors')
// const secretoryRouter = require("./routers/secretories");

const sosRouter = require("./routers/sos");
const alertRouter = require('./routers/getpass')
const { postRouter } = require('./routers/post')
const societiesOwnerRouters = require('./routers/societies_owners')
const blockRouter = require('./routers/blocks.routes')
const flatRouter = require('./routers/flats.routes')
const masterRoutes = require('./routers/master.routes')
const superAdminRouter = require('./routers/superAadmin.routes')
const essentialContactRouter = require('./routers/essentialsContacts.routes')
const noticeRouter = require('./routers/notice.routers')
const vendorsRouter = require('./routers/vendors.routers')
const vendorsServicesRouter = require('./routers/vendors_services.routers')
const bookingVendorsRouter = require('./routers/bookingVendors.routers')
const ticketRouter = require('./routers/ticket.router')

const app = express()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
dotenv.config()
app.use(morgan("combined"))
app.use(cookiesParser())

// Serve uploaded files (stored on disk under ./uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "https://admin.kamalhousing.com",
      "https://kamalhousing.com",
      "https://www.delhipropertybazaar.com",
      "https://delhipropertybazaar.com",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

  // app.use(  
  //   cors({
  //     origin: [
  //       "http://localhost:5173",
  //       "https://admin.kamalhousing.com",
  //       "https://www.delhipropertybazaar.com",
  //       "https://delhipropertybazaar.com",
  //       "https://kamalhousing.com",
  //     ],
  //     credentials: true,
  //   })
  // );

(async () => {
  try {
    const res = await client.query("SELECT NOW()");
    console.log("Database is connected:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();
    
app.use("/api/resident",residentsRouter)
app.use("/api/guard", routerGuards);
app.use("/api/secretory", adminRouter);
app.use("/api/master-admin", masterRoutes);
app.use("/api/super-admin", superAdminRouter);
app.use("/api/apartment", apartmentRouter);
app.use("/api/complaint", complaintsRouter);
app.use("/api/visitor",visitorsRouter)
app.use("/api/essential-contacts", essentialContactRouter);
app.use("/api/sos", sosRouter);
app.use("/api/getpass", alertRouter);
app.use("/api/post", postRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/owner", societiesOwnerRouters);
app.use("/api/society", societiesRouter);
app.use("/api/blocks", blockRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/vendors-services", vendorsServicesRouter);
app.use("/api/flats", flatRouter);
app.use("/api/notice", noticeRouter);
app.use("/api/booking-vendors", bookingVendorsRouter);


app.get("/",(req,res)=>{
    res.send("Smart Society me apka swagat hai....")
}) 

const PORT = process.env.PORT || 5001

app.listen(PORT, ()=>{console.log(`Server ${PORT} pe upyog mein hai...`)})
