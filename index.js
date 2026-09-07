const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const admin = require("firebase-admin");
const { cert } = require("firebase-admin/app");

const port = process.env.PORT || 3000;

// --------------------------------------------------
// Firebase Admin
// --------------------------------------------------

const decoded = Buffer.from(
  process.env.FIREBASE_SERVICE_KEY,
  "base64"
).toString("utf8");

const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: cert(serviceAccount),
});

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://smart-deals-30397.web.app",
    ],
  })
);

app.use(express.json());

// --------------------------------------------------
// Firebase Token Middleware
// --------------------------------------------------

const verifyFireBaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    console.log("inside token", decoded);

    req.token_email = decoded.email;

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }
};

// --------------------------------------------------
// JWT Middleware
// --------------------------------------------------

const verifyJWTToken = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access",
    });
  }

  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      message: "unauthorized access",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "unauthorized access",
      });
    }

    console.log("after decoded", decoded);

    req.token_email = decoded.email;

    next();
  });
};

// --------------------------------------------------
// MongoDB
// --------------------------------------------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.figz0pw.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Collection variables
let productsCollection;
let bidCollection;
let usersCollection;

// --------------------------------------------------
// Connect Database
// --------------------------------------------------

async function connectDB() {
  if (productsCollection && bidCollection && usersCollection) {
    return;
  }

  await client.connect();

  const db = client.db("smart_db");

  productsCollection = db.collection("products");
  bidCollection = db.collection("bids");
  usersCollection = db.collection("users");

  console.log("MongoDB connected");
}

// --------------------------------------------------
// Root API
// --------------------------------------------------

app.get("/", (req, res) => {
  res.send("Smart server is running");
});

// --------------------------------------------------
// JWT API
// --------------------------------------------------

app.post("/getToken", async (req, res) => {
  try {
    await connectDB();

    const loggedUser = req.body;

    const token = jwt.sign(
      loggedUser,
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.send({
      token: token,
    });
  } catch (error) {
    console.error("getToken error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Users APIs
// --------------------------------------------------

app.post("/users", async (req, res) => {
  try {
    await connectDB();

    const newUser = req.body;

    const email = req.body.email;

    const query = {
      email: email,
    };

    const existingUser = await usersCollection.findOne(query);

    if (existingUser) {
      return res.send({
        message: "user already exists. Do not need to insert again",
      });
    }

    const result = await usersCollection.insertOne(newUser);

    res.send(result);
  } catch (error) {
    console.error("users error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Products APIs
// --------------------------------------------------

// Get all products
app.get("/products", async (req, res) => {
  try {
    await connectDB();

    console.log(req.query);

    const email = req.query.email;

    const query = {};

    if (email) {
      query.email = email;
    }

    const cursor = productsCollection.find(query);

    const result = await cursor.toArray();

    res.send(result);
  } catch (error) {
    console.error("products error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Latest Products
// --------------------------------------------------

app.get("/latest-product", async (req, res) => {
  try {
    await connectDB();

    const cursor = productsCollection
      .find()
      .sort({
        created_at: -1,
      })
      .limit(6);

    const result = await cursor.toArray();

    res.send(result);
  } catch (error) {
    console.error("latest-product error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Specific Product
// --------------------------------------------------

app.get("/products/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;

    const query = {
      _id: new ObjectId(id),
    };

    const result = await productsCollection.findOne(query);

    res.send(result);
  } catch (error) {
    console.error("single product error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Add Product
// --------------------------------------------------

app.post("/products", verifyFireBaseToken, async (req, res) => {
  try {
    await connectDB();

    console.log("headers in the post", req.headers);

    const newProduct = req.body;

    const result = await productsCollection.insertOne(newProduct);

    res.send(result);
  } catch (error) {
    console.error("post product error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});
// --------------------------------------------------
// Update Product
// --------------------------------------------------

app.patch("/products/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;

    const updatedProduct = req.body;

    const query = {
      _id: new ObjectId(id),
    };

    const update = {
      $set: {
        title: updatedProduct.title,
        price_min: Number(updatedProduct.price_min),
        price_max: Number(updatedProduct.price_max),
        category: updatedProduct.category,
        condition: updatedProduct.condition,
        usage: updatedProduct.usage,
        location: updatedProduct.location,
        description: updatedProduct.description,
      },
    };

    const result = await productsCollection.updateOne(
      query,
      update
    );

    res.send(result);
  } catch (error) {
    console.error("update product error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});


// --------------------------------------------------
// Delete Product
// --------------------------------------------------

app.delete("/products/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;

    const query = {
      _id: new ObjectId(id),
    };

    const result = await productsCollection.deleteOne(query);

    res.send(result);
  } catch (error) {
    console.error("delete product error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Bids APIs
// --------------------------------------------------

// Get bids by buyer email
app.get(
  "/bids",
  verifyFireBaseToken,
  async (req, res) => {
    try {
      await connectDB();

      const email = req.query.email;

      const query = {};

      if (email) {
        query.buyer_email = email;
      }

      if (email !== req.token_email) {
        return res.status(403).send({
          message: "forbidden access",
        });
      }

      const cursor = bidCollection.find(query);

      const result = await cursor.toArray();

      res.send(result);
    } catch (error) {
      console.error("get bids error:", error);

      res.status(500).send({
        message: "Internal Server Error",
      });
    }
  }
);

// --------------------------------------------------
// Get bids for specific product
// --------------------------------------------------

app.get(
  "/products/bids/:productId",
  verifyFireBaseToken,
  async (req, res) => {
    try {
      await connectDB();

      const productId = req.params.productId;

      const query = {
        product: productId,
      };

      const cursor = bidCollection
        .find(query)
        .sort({
          bid_price: -1,
        });

      const result = await cursor.toArray();

      res.send(result);
    } catch (error) {
      console.error("product bids error:", error);

      res.status(500).send({
        message: "Internal Server Error",
      });
    }
  }
);

// --------------------------------------------------
// Add Bid
// --------------------------------------------------

app.post("/bids", async (req, res) => {
  try {
    await connectDB();

    const newBid = req.body;

    const result = await bidCollection.insertOne(newBid);

    res.send(result);
  } catch (error) {
    console.error("post bid error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Delete Bid
// --------------------------------------------------

app.delete("/bids/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;

    const query = {
      _id: new ObjectId(id),
    };

    const result = await bidCollection.deleteOne(query);

    res.send(result);
  } catch (error) {
    console.error("delete bid error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Update Bid
// --------------------------------------------------

app.patch("/bids/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;

    const updatedBid = req.body;

    const query = {
      _id: new ObjectId(id),
    };

    const update = {
      $set: {
        buyer_email: updatedBid.buyer_email,
        buyer_name: updatedBid.buyer_name,
        bid_price: updatedBid.bid_price,
      },
    };

    const result = await bidCollection.updateOne(
      query,
      update
    );

    res.send(result);
  } catch (error) {
    console.error("update bid error:", error);

    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

// --------------------------------------------------
// Start Server - Local
// --------------------------------------------------

if (require.main === module) {
  app.listen(port, () => {
    console.log(
      `smart server is running in port : ${port}`
    );
  });
}

// --------------------------------------------------
// Vercel
// --------------------------------------------------

module.exports = app;