const express = require("express"); 
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");

dotenv.config()

app.set( "view engine" , "ejs"); 

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public')); 

// Connection URL
mongoose.connect(`mongodb+srv://${process.env.USER_KEY}:${process.env.PASSWORD}@cluster0.zdher41.mongodb.net/todolistDB`);

// mongoose schema 
       // to do list schema
    const itemsSchema = new mongoose.Schema ({
      name: {
         type: String
      }
   });

       // custom list schema
    const listschema = new mongoose.Schema ({
      name: {
         type: String 
      } ,
      items:[itemsSchema]
   });

// mongoose model
       // to do list model 
   const Items = mongoose.model("Items" , itemsSchema);

       // custom list model
   const List = mongoose.model("List", listschema);


// adding new items
const item1 = new Items ({
   name: ""
});

const defaultItems = [item1];
 
// get request
app.get("/" , function(req , res){
   Items.find({} , function(err , foundItems) {
      if (foundItems.length === 0) {
         Items.insertMany(defaultItems , function(err){
            if (err) {
               console.log(err)
            } else {
               console.log("Items added")
            }
         });
         res.redirect("/")
      } else {
         res.render("list" , {listTitle: "Today" , newListItems : foundItems})
      }
   });
});

// express route parameters 
app.get("/:customListName" , function(req, res){
   const customListName = req.params.customListName.toLowerCase()
List.findOne({name:customListName}, async function (err, foundList){
   if(!err) {
      if(!foundList) {
         const list = new List ({
            name: customListName ,
            items: defaultItems
         })
         await list.save();
         res.redirect("/" + customListName)
   } else {
      res.render("list" , {listTitle: _.startCase(foundList.name) , newListItems : foundList.items})
      }
    }
  });
});

app.get('/favicon.ico', function(req, res) {
   res.status(204);
   res.end();
});

// post request 
app.post("/" , function(req, res){
   let itemName = req.body.newItem;
   let listName = req.body.list;

   const item = new Items ({
      name: itemName 
   });

   if (_.trim(listName) === "today"){
      item.save()
      res.redirect("/");
   } else {
      List.findOne({name: listName} , function(err, foundList){
         foundList.items.push(item)
         foundList.save()
         res.redirect("/" + listName)
      });
   }
});

app.post("/delete" , function(req, res){
   const checkboxItemId = (req.body.checkbox);
   const listName = (req.body.listname);

   if(listName === "today") {
      Items.findByIdAndRemove(checkboxItemId, function(err) {
         if (err) {
            console.log(err)
         } else {
            res.redirect("/" )
         }
      })
   } else {
      List.findOneAndUpdate({name: listName}, 
         {$pull:{ items:{_id:checkboxItemId}}} , function(err, foundList){
            if (!err){
               res.redirect("/" + listName)
            }
       })
   }
}); 



app.listen(process.env.PORT|| 3000 , function(){
    console.log("Server stared !");
}); 