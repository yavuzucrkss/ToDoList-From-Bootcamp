//jshint esversion:6
require('dotenv').config(); 
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set('strictQuery', true)
mongoose.connect(process.env.MONGODB, { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const listsSchema = ({
  name: {
    type: String
  },
  items: [itemsSchema]
});

const List = new mongoose.model("List", listsSchema);

const item1 = new Item({
  name: "Welcome to toDoList v2"
})

const item2 = new Item({
  name: "Hit the + button to add new item"
})

const item3 = new Item({
  name: "<-- Hit this to delete an item"
})

const startItems = [item1, item2, item3];


app.get("/", function (req, res) {

  Item.find(function (err, foundedItems) {
    foundedItems.forEach(item => {
      console.log(item);
    })
    if (foundedItems.length === 0) {
      Item.insertMany(startItems, err => {
        if (err) console.log(err);
        else console.log("Succesfully Inserted Items");
      })
      res.redirect("/"); //after initial insert we have to redirect for show the items.
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundedItems });
    }
  });
})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listTitle === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, (err, foundList) => {

      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listTitle);
    })
  }



});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    //doesn't need calback funchtion able to use deleteOne()
    Item.findByIdAndRemove(checkedItemId, err => {
      if (!err) console.log("Delete operation suggested!")
    })
    res.redirect("/");
  }else{
    
    //operation to update (delete) embedded data.
    //Delete is done with '$pull'
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, (err,foundList) => {
      if(!err) res.redirect("/" + listName);
    })

  }
})



app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: startItems
        })
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    }
  })
});



app.get("/about", function (req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function () {
  console.log("Server has started Successfuly ");
});
