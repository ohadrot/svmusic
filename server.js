
const experss = require('express')
const app = experss()
let PORT = process.env.PORT || 8080
const db = require('mongoose')
const axios = require('axios')
const bp = require('body-parser')
const jwt = require('jsonwebtoken')


const apiKey = 'AIzaSyCtUZeivPKtSZOSTLDd_nAionokPR6XEZA'
const baseUrl = 'https://www.googleapis.com/youtube/v3'
app.use(bp.urlencoded({extended:true}))
app.use(experss.json())

const cors = require('cors');

//enables cors
app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'exposedHeaders': ['sessionId'],
  'origin': '*',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false
}));

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});


//9b2imNlVbkHReWDP
db.connect('mongodb+srv://shem:9b2imNlVbkHReWDP@cluster0.gbavwhk.mongodb.net/test',(err)=>{
  if(err) throw err;
  console.log('db connect');
})

const playList =  db.Schema({
  name:String,
  list:Array
})


const playListModel = db.model('playlist',playList)

app.post('/createplaylist', async (req,res)=>{
  console.log(req.body);
  if (await playListModel.findOne({name:req.body.name})==null){
    await playListModel.insertMany({name:req.body.name,list:[]})
    res.status(200).json({msg:'playlist created!'})
  }
  else{
    res.status(400).json({msg:'name already exist'}).end()
  }
})

app.delete('/deleteplaylist', async (req,res)=>{
  if (await playListModel.findOne({name:req.body.name})!=null){
    await playListModel.deleteOne({name:req.body.name})
    res.status(200).json({msg:'playlist deleted!'})
  }
  else{
    res.status(400).json({msg:'playlist not found'}).end()
  }
})

app.put('/editplaylistname', async (req,res)=>{
  if (await playListModel.findOne({name:req.body.name})!=null){
    await playListModel.findOneAndUpdate({name:req.body.name},{name:req.body.newname})
    res.status(200).json({msg:'edit completed'})
  }
  else{
    res.status(400).json({msg:'playlist not found'}).end()
  }
})



app.post('/search', async(req,res,next)=>{

  try{
    const searchQuery = req.body.song
    const result = await axios.get(`${baseUrl}/search?key=${apiKey}&type=video&part=snippet&q=${searchQuery}`)
    
   // const list = result.data.items.map((item)=>item.snippet.title)
   // res.send(list)

   let temp = await playListModel.findOne({name:req.body.name})

   if (temp != null){
    await playListModel.findByIdAndUpdate(temp,{list:[...temp.list,{name:result.data.items[0].snippet.title,year:result.data.items[0].snippet.publishTime}]})
    res.status(200).json({msg:` ${result.data.items[0].snippet.title} is added!`})
  }
  else{
    res.status(400).json({msg:'error'}).end()
  }

  }
  catch(err){
    next(err)
  }
  

})

app.get('/all', async (req,res)=>{
  let all =  await playListModel.find()
  res.status(200).json(all)
})




app.get('/', (req,res)=>{

  res.send('Welcome to SVMUSIC')
})

app.get('/clear', async(req,res)=>{
  await playListModel.deleteMany({})
  res.status(200).json({msg:'clear all'})
})


app.get('/findplaylist',async(req,res)=>{
  let queryName = req.query.name;
  let result = await playListModel.findOne({name:queryName});
  if(result== null )
    res.status(400).send('playlist dosnt found');
  else{
    let newList = result.list.map((val)=>{return val.name})
    res.status(200).json(newList);
  }
})

//////////////////////////// tokens work:

app.post('/signin',async(req,res)=>{
  if(req.body.user == 'ohad' && req.body.password == '1234')
  {
    const token = jwt.sign({user: 'ohad'}, 'helloadmin',{expiresIn: "10m"});
    res.json({token});
  }
  else{
    res.status(403).send('Incorrect password or user');
  }
})

app.get('/admin',checkAdmin,(req,res)=>{
  res.status(200).send('you are now admin');
})

function checkAdmin(req,res,next){
  try{
  let token = req.headers.authorization.substring(req.headers.authorization.indexOf(' ')+1);
  jwt.verify(token,'helloadmin');
  next();
  }
  catch{
    res.status(403).send('Not authorized')
    return;
  }
}

app.listen(PORT,()=>{console.log('Server On');})







