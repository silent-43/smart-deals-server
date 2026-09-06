const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const admin = require("firebase-admin");
const {cert} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const port = process.env.PORT || 3000;
// console.log(process.env)




const serviceAccount = require("./smart-deals-firebase-admins-key.json");
admin.initializeApp({
  credential: cert(serviceAccount)
});


const verifyFireBaseToken = async (req, res, next) => {
  console.log("Authorization:", req.headers.authorization);

  if (!req.headers.authorization) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }


  //verify token
  try {
    const userInfo = await getAuth().verifyIdToken(token);

    req.token_email = userInfo.email;
    // console.log("Token verified:", userInfo.email);
    console.log("After Token verified:", userInfo);

    next();
  } catch (error) {
    console.log('Invalid Token');
    // console.log("Firebase Token Error:", error);

    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }
  
};



//middleware
app.use(cors());
app.use(express.json());
const logger = (req, res, next)=>{
    console.log('logging info');
    next();
}

//------------------------------------------------------------------------------------------------------
//middleware jwt
const verifyJWTToken = (req, res, next)=>{
    // console.log('in middleware : ', req.headers);

    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({message : 'unauthorized access'})
    }
    const token = authorization.split(' ')[1];
    if(!token){
        return res.status(401).send({message : 'unauthorized access'})
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).send({message: 'unauthorized access'})
        }
         
         console.log('after decoded', decoded)
         req.token_email = decoded.email;  
         
         //put it in the right place
         next();
        
    } )

   
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.figz0pw.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res)=>{
    res.send("Smart server is running");
})





async function run(){
    try{
        await client.connect();

        const db = client.db('smart_db');
        const productsCollection = db.collection('products');
        const bidCollection = db.collection('bids');


        //from client side, user data send to the database and check if user already exists or
        const usersCollection = db.collection('users');



        //jwt related apis

        //-----------------------------------------------------------------------------------------------------------
        //custom token create 1st step
        //generate custom token
        app.post('/getToken', (req, res) => {
            const loggedUser = req.body;
            const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {expiresIn: '1h'});
            res.send({token: token});
        })
        //-------------------------------------------------------------------------------------------------------------





        //Users APIs
        app.post('/users', async(req, res)=>{
            const newUser = req.body;

            //check existing user 
            const email = req.body.email;
            const query = {email: email};
            const existingUser = await usersCollection.findOne(query);
            if(existingUser){
                res.send({message : 'user already exists. Do not need to insert again'})
            }
            else{
                const result =  await usersCollection.insertOne(newUser);
            res.send(result);

            }
        })



        //Products APIs
        app.get('/products', async(req, res)=>{
            // const projectFields = {title : 1, price_min : 1, price_max : 1, image : 1};
            // const cursor = productsCollection.find().sort({price_min: 1}).skip(2).limit(3).project(projectFields);

            console.log(req.query);
            const email = req.query.email;
            const query = {};
            if(email){
                query.email = email;
            }

            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        

        app.get('/latest-product', async(req, res)=>{
            const cursor = productsCollection.find().sort({created_at: -1}).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        //specific product
        app.get('/products/:id', async (req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.send(result);
        })

        //post
        app.post('/products', async (req, res)=>{
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
        })

        //Update
        app.patch('/products/:id', async (req, res)=>{
            const id = req.params.id;
            const updatedProduct = req.body;
            const query = {_id: new ObjectId(id)};

            const update = {
                $set: {
                    name : updatedProduct.name,
                    price : updatedProduct.price
                }
            }
            const result = await productsCollection.updateOne(query, update);
            res.send(result);
        })

        //delete
        app.delete('/products/:id', async (req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })



        //---------------------------------------------------------------------------------------------------------
        app.get('/bids', verifyJWTToken, async(req, res)=>{
            // console.log('headers', req.headers);
            const email = req.query.email;
            const query = {};
            if(email){
                query.buyer_email = email;
            }
            if(email !== req.token_email){
                return res.status(403).send({message : 'forbidden access'})
            }
            const cursor = bidCollection.find(query)
            const result = await cursor.toArray()
            res.send(result);
        })

        //-----------------------------------------------------------------------------------------------------------


        //Bids APIs
        // app.get('/bids', logger, verifyFireBaseToken, async (req, res)=>{

        //     // console.log('headers', req.headers)
            
        //     const email = req.query.email;
        //     const query = {};
        //     if(email){
        //         if(email !== req.token_email){
        //             return res.status(403).send({message : 'forbidden Access'})
        //         }
        //         query.buyer_email = email;
        //     }


        //     const cursor = bidCollection.find(query);
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })

        app.get('/products/bids/:productId', verifyFireBaseToken, async(req, res)=>{
            const productId = req.params.productId;
            const query = {product: productId};
            const cursor = bidCollection.find(query).sort({bid_price: -1});
            const result = await cursor.toArray();
            res.send(result);
        })

        // app.get('/bids', async (req, res) => {

        //     const query = {};
        //     if(query.email){
        //         query.buyer_email=email;
        //     }

        //     const cursor = bidCollection.find(query);
        //     const result = await cursor.toArray();
        //     res.send(result);
        // }) 

        app.post('/bids', async (req, res)=>{
            const newBid = req.body;
            const result = await bidCollection.insertOne(newBid);
            res.send(result);
        })

        app.delete('/bids/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await bidCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/bids/:id', async(req, res)=>{
            const id = req.params.id;
            const updatedBid = req.body;
            const query ={_id: new ObjectId(id)};
            const update = {
                $set: {
                    buyer_email : updatedBid.buyer_email,
                    buyer_name : updatedBid.buyer_name,
                    bid_price : updatedBid.bid_price
                }
            }

            const result = await bidCollection.updateOne(query, update);
            res.send(result);

        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally{

    }
}
run().catch(console.dir)




app.listen(port, (req, res)=>{
    console.log(`smart server is running in port : ${port}`);
})