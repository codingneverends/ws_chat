
const exp=require('express');
const app=exp();
const path=require('path');
const exphandlebars=require('express-handlebars');
const bodyparser=require('body-parser');

require('dotenv').config();

const ws_server=require('./server')

app.use(bodyparser.urlencoded({
    extended : true
}));
app.use(exp.json());
app.use(exp.static('public'));

app.set('views',path.join(__dirname,"/views/"));

app.engine("hbs",exphandlebars({
    extname : "hbs",
    defaultLayout : "mainlayout",
    layoutsDir : __dirname+"/views/layouts"
}))

app.set("view engine","hbs");

app.get("/",(req,res)=>{
    res.render("index",{});
})

app.get("/chat",(req,res)=>{
    res.render("chat",{});
})

const port = process.env.APP_PORT || 3000;
app.listen(port,()=>{
    console.log("Server started");
})
