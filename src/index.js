import React from "react";
import ReactDOM from "react-dom/client";
import { Navbar, Footer } from "./pages/layout";
import { Home } from "./pages/home";
import { Task } from "./pages/tasks";
import { Epic } from "./pages/epics";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
    return (
        <>
        <BrowserRouter>
        <Navbar />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Task />} />
            <Route path="/epics" element={<Epic />} />
        </Routes>
        <Footer />
        </BrowserRouter>
        </>
    );
} 

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
