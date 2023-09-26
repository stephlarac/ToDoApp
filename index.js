require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const port = 3000;

const date = new Date().toLocaleDateString('en-us',{ weekday:"long", month:"long", day:"numeric"});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//mongoose.connect('mongodb://127.0.0.1:27017/todolistDB'); //local server
mongoose.connect(`mongodb+srv://stephlarac:${process.env.PASSWORD}@cluster0.l8ta1yc.mongodb.net/todolistDB`);

const itemSchema = new mongoose.Schema ({
    name: String
});

const Item = mongoose.model("Item", itemSchema);

const itemOne = new Item ({
    name: "Welcome to your todolist!"
});

const itemTwo = new Item ({
    name: "Hit the + button to add a new task"
});

const itemThree = new Item ({
    name: "<-- Hit this to delete a task"
});

const defaultItems = [itemOne, itemTwo, itemThree];

const listSchema = new mongoose.Schema ({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get('/', async (req,res)=>{
    try {
        const itemList = await Item.find();
        if (itemList.length === 0){
            await Item.insertMany(defaultItems);
            res.redirect('/');
        } else{
            res.render("index.ejs", {listTitle: date, toDoList: itemList});
        };
      } catch (err) {
        console.log("error");
      }
});

app.post("/", async (req,res)=>{
    try {
        const itemName = req.body.newTask;
        const listName = req.body.list;
        const item = new Item ({
            name: itemName
        });
        if(listName === date){
            await item.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({name: listName});
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/" + listName);
        }
       
    } catch (err) {
        console.log("error");
    }
    
});

app.post("/delete", async (req,res)=>{
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    try {
        if (listName === date){
            await Item.findByIdAndRemove(checkedItemId);
            res.redirect("/");
        } else {
            await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
            res.redirect("/" + listName);
        }
        
    } catch (err) {
        console.log("error");
    }
    
});

app.get("/:costumListName", async (req,res)=>{
    const costumListName = _.capitalize(req.params.costumListName);
    try {
        const foundList = await List.findOne({name: costumListName});
        if (foundList){
            res.render("index.ejs", {listTitle: foundList.name, toDoList: foundList.items});
        } else {
            const list = new List ({
                name: costumListName,
                items: defaultItems
            });
            await list.save();
            res.redirect("/"+ costumListName);
        };
    } catch (err) {
        console.log("error");
    };
});

app.listen(port,()=>{
    console.log("Server started on port "+ port);
});
