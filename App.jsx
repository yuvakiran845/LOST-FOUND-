import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AddItem from "./pages/AddItem";
import Navbar from "./components/Navbar";
import ItemDetails from "./pages/ItemDetails";


function App() {
  return (
    <BrowserRouter>
    
      <Navbar /> {/* Navbar added here */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/item/:id" element={<ItemDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
