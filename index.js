// Imports
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
// login
const bcrypt = require("bcrypt");
// upload image
const multer = require("multer");
const path = require("path");

const app = express();

// DB Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Ivan@1928",
    database: "smpc_login",
})

//Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/image");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({storage: storage})

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//API Registration
app.post("/api/registration", async (req, res) => {

    const qValidate = "SELECT * FROM users WHERE email = ?";

    const qInsert = "INSERT INTO users(`name`, `email`, `password`) VALUES (?,?,?)";

    const name = req.body.name;
    const email = req.body.email;
    const password = await bcrypt.hash(req.body.password, 12);

    db.query(qValidate, [email], (err, data) => {
        if(err) return res.json({message: 'An error occured'})

        if(data.length > 0) {
            
            return res.json({message: 'The user already exists. Please use a different email address.'})
        } else {
            
            db.query(qInsert, [name, email, password], (err, data) => {
                console.log(err);
                if(err) return res.json({message: 'An error occured'}); 
                
                return res.json({message: 'You have successfully registered.'});
            })
         }
         db.end();
    })

})

//API Login
app.post("/api/admin", (req, res) => {
    const {email, password} = req.body;

    const q = "SELECT * FROM users WHERE email = ?";

    db.query(q, [email], async (err, data) => { 
        if(err) {
            return res.json({message: 'An error occured'});
        } else {
            if(data.length > 0) {
                const user = data[0];

                const match = await bcrypt.compare(password, user.password);

                if(match) {
                    return res.json({message: 'Logged in succesfully', success: true})
                }else {
                    return res.json({message: 'Invalid email addres and/or password', success: false})
                }
            } else{

            }
        }
    })

})

//Upload Image API
app.post("/api/upload", upload.single('image'), (req, res) => {
   const imgFilename = req.file.filename;

   const q = "INSERT INTO images (filename) VALUES (?)";

   db.query(q, [imgFilename], (err,data) => {
    if(err) return res.json({message: 'Error uploading the image'});

    return res.json({message: 'Success uploading image'});
   })
})

//Fetch Image API
app.get("/api/image", (req, res) => {
    const q = "SELECT * FROM images ORDER BY id DESC";

    db.query(q, (err, data) => {
        if(err) return res.json({message: 'An error ocurred.'});
        return res.json(data);
    })
})


//Announcement
app.get("/adminhome", (req, res) => {
    const q = "SELECT * FROM bulletins";
    db.query(q, (err, data) => {
        if(err) return res.json(err);
        return res.json(data);
    })
})

//Create New Announcement
app.post("/adminhome", (req, res) => {
    const q = "INSERT INTO bulletins (`title`, `desc`, `cover`) VALUES (?)";
    const values = [
        req.body.title,
        req.body.desc,
        req.body.cover
    ];

    db.query(q, [values], (err, data) => {
        if(err) return res.json(err);
        return res.json("Announcement added sucessfully.");
    })
})

//Delete Announcement
app.delete("/adminhome/:id", (req, res) => {
    const bulletinID = req.params.id;
    const q = "DELETE FROM bulletins WHERE anz_id = ?";

    db.query(q, [bulletinID], (err,data) => {
        if(err) return res.json(err);
        return res.json("Announcement deleted sucessfully.");   
    })
})

// Update Announcement
app.put("/adminhome/:id", (req, res) => {
    const bulletinID = req.params.id;
    const q = "UPDATE bulletins SET `title` = ?, `desc` = ?, `cover` = ? WHERE anz_id = ?";
    
    const values = [
        req.body.title,
        req.body.desc,
        req.body.cover
    ];
    
    db.query(q, [...values, bulletinID], (err, data) => {
        if(err) return res.json(err);
        return res.json("Announcement updated sucessfully.");
    })
})


// Listener
app.listen(8000, () => {
    console.log("Server is running on port 8000...")
})