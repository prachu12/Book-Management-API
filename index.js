require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
//Database
const database = require("./database/database");


//Models
const BookModel = require("./database/Book.js");
const AuthorModel = require("./database/author.js");
const PublicationModel = require("./database/publication.js");

//Initialise express
const booky = express();

booky.use(bodyParser.urlencoded({extended: true}));
booky.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URL,
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}
).then(() => console.log("Connection Established"));

/*
Route            /
Description      Get all the books
Access           PUBLIC
Parameter        NONE
Methods          GET
*/
booky.get("/",async (req,res) => {
  const getAllBooks = await BookModel.find();
  return res.json(getAllBooks);
});

/*
Route            /is
Description      Get specific book on ISBN
Access           PUBLIC
Parameter        isbn
Methods          GET
*/
booky.get("/is/:isbn",async (req,res) => {
  const getSpecificBook = await BookModel.findOne({ISBN: req.params.isbn});
  

//null !0=1 , !1=0
  if(!getSpecificBook) {
    return res.json({error: `No book found for the ISBN of ${req.params.isbn}`});
  }

  return res.json({book: getSpecificBook});
});


/*
Route            /c
Description      Get specific book on category
Access           PUBLIC
Parameter        category
Methods          GET
*/

booky.get("/c/:category", async (req,res) => {
  const getSpecificBook = await BookModel.findOne({ISBN: req.params.category});
  

//null !0=1 , !1=0
  if(!getSpecificBook) {
    return res.json({error: `No book found for the category of ${req.params.category}`});
  }

  return res.json({book: getSpecificBook});
});


/*
Route            /author
Description      Get all authors
Access           PUBLIC
Parameter        NONE
Methods          GET
*/

booky.get("/",async (req,res) => {
  const getAllAuthors = await AuthorModel.find();
  return res.json(getAllAuthors);
  
});

/*
Route            /author/book
Description      Get all authors based on books
Access           PUBLIC
Parameter        isbn
Methods          GET
*/

booky.get("/author/book/:isbn", (req,res) => {
  const getSpecificAuthor = database.author.filter(
    (author) => author.books.includes(req.params.isbn)
  );

  if(getSpecificAuthor.length === 0){
    return res.json({
      error: `No author found for the book of ${req.params.isbn}`
    });
  }
  return res.json({authors: getSpecificAuthor});
});

/*
Route            /publications
Description      Get all publications
Access           PUBLIC
Parameter        NONE
Methods          GET
*/

booky.get("/",async (req,res) => {
  const getAllPublications = await PublicationModel.find();
  return res.json(getAllPublications);
});


/*
Route            /book/new
Description      Add new books
Access           PUBLIC
Parameter        NONE
Methods          POST
*/

booky.post("/book/new",async (req,res) => {
  const { newBook } = req.body;
  const addNewBook = BookModel.useCreateIndex(newBook);
  return res.json({
    books: addNewBook,
    message: "Book was added!!!"
  });
});

/*
Route            /author/new
Description      Add new authors
Access           PUBLIC
Parameter        NONE
Methods          POST
*/

booky.post("/author/new", (req,res) => {
  const { newAuthor } = req.body;
  const addNewAuthor = AuthorModel.create(newAuthor);
  return res.json(
    {
      author: addNewAuthor,
      message: "Author was added!!!"
    }
  );
});

/*
Route            /publication/new
Description      Add new authors
Access           PUBLIC
Parameter        NONE
Methods          POST
*/


booky.post("/publication/new", (req,res) => {
  const newPublication = req.body;
  database.publication.push(newPublication);
  return res.json(database.publication);
});


/******************** PUT***********/
/*
Route            /publication/update/book
Description      update book on isbn
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/

booky.put("/book/update/:isbn", async (req,res) => {
  const updatedBook = await BookModel.findOneAndUpdate(
    {
      ISBN: req.params.isbn
    },
    {
      title: req.body.bookTitle
    },
    {
      new: true
    }
  );

  return res.json({
    books:updatedBook
  });
})

/**********Updating new author**********/
/*
Route            /book/author/update
Description      update //add new author
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/

booky.put("/book/author/update/:isbn", async(req,res) => {
 //update book database
const updatedBook = await BookModel.findOneAndUpdate(
  {
    ISBN: req.params.isbn
  },
  {
    $addToSet: {
      authors: req.body.newAuthor
    }
  },
  {
    new: true
  }
);

//update the author database
const updatedAuthor = await AuthorModel.findByIdAndUpdate(
  {
    id: req.body.newAuthor
  },
  {
    $addToSet: {
      books: req.params.isbn
    }
  },
  {
    new: true
  }
);
return res.json(
  {
    bookss : updatedBook,
    authors : updatedAuthor,
    message: "New author was added"

  }
);

});









/*
Route            /publication/update/book
Description      update //add new publication
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/


booky.put("/publication/update/book/:isbn",(req,res) => {
  //update the publication database
  database.publication.forEach((pub) => {
    if(pub.id === req.body.pubID) {
      return pub.books.push(res.params.isbn);
    }
  });

  //update the book database
  database.books.forEach((book) => {
    if(book.ISBN === req.params.isbn) {
      book.publications = req.body.pubID;
      return;
    }
  });

  return res.json(
    {
      books: database.books,
      publications: database.publication,
      message: "Successfully updated publications"
    }
  )

});

/************DELETE***********/
/*
Route            /book/delete
Description      delete a book
Access           PUBLIC
Parameter        isbn
Methods          DELETE
*/

booky.delete("/book/delete/:isbn", (req,res) => {
  //whichever book that doesnot match with the isbn, just send it to an updatedBook database 
  //and rest eill be filtered out
  const updatedBookDatabase = await BookModel.findOneAndDelete(
    {
      ISBN: req.params.isbn

    }
  );
  return res.json({
    books: updatedBookDatabase
  });
});

/*
Route            /book/delete
Description      delete an author from a book and vice versa
Access           PUBLIC
Parameter        isbn,authorID
Methods          DELETE
*/

booky.delete("/book/delete/author/:isbn/:authorID", (req,res) => {
  //update the book database
  database.books.forEach((book) => {
    if(book.ISBN === req.params.isbn) {
      const newAuthorList = book.author.filter(
        (eachAuthor) => eachAuthor !== parseInt(req.params.authorID)
      );
      book.author = newAuthorList;
      return;
    }
  });
  
  //update the book database
  database.books.forEach((book)=>{
    if(book.ISBN === req.params.isbn) {
      const newAuthorList = book.author.filter(
        (eachAuthor) => eachAuthor !== parseInt(req.params.authorId)
      );
      book.author = newAuthorList;
      return;
    }
  });

 //Update the author database
 database.author.forEach((eachAuthor) => {
   if(eachAuthor.id === parseInt(req.params.authorId)) {
     const newBookList = eachAuthor.books.filter(
       (book) => book !== req.params.isbn
     );
     eachAuthor.books = newBookList;
     return;
   }
 });

 return res.json({
   book: database.books,
   author: database.author,
   message: "Author was deleted!!!!"
 });
});



booky.listen(3003,() => {
  console.log("Server is up and running");
});
