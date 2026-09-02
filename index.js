const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
// console.log(process.env)

//middleware
app.use(cors());
app.use(express.json());



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




        //Bids APIs
        app.get('/bids', async (req, res)=>{

            const email = req.query.email;
            const query = {};
            if(email){
                query.buyer_email = email;
            }


            const cursor = bidCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/products/bids/:productId', async(req, res)=>{
            const productId = req.params.productId;
            const query = {product: productId};
            const cursor = bidCollection.find(query).sort({bid_price: -1});
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/bids', async (req, res) => {

            const query = {};
            if(query.email){
                query.buyer_email=email;
            }

            const cursor = bidCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        }) 

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