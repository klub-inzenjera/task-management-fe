import React, { useEffect, useState } from "react";
import { data } from "react-router-dom";

export function Task() {
    const [content, setContent] = useState(<TaskList showForm={showForm} />);

    function showList() {
        setContent(<TaskList showForm={showForm} />);
    }

    function showForm(task) {
        setContent(<TaskForm task={task} showList={showList} epics={epics} />);
    }

    const [epics, setEpics] = useState([]);
    
    useEffect(() => {
        // Fetch epics
        fetch("http://localhost:3004/epics")
            .then((response) => response.json())
            .then((data) => setEpics(data))
            .catch((error) => console.error("Error fetching epics:", error));
    }, []);

    return (
        <div className="container my-5">
            {content}
        </div>
    );
}

function TaskList(props) {
    const [tasks, setTasks] = useState([]);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => fetchTasks(), []);

    function fetchTasks() {
        fetch("http://localhost:3004/tasks")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Unexpected server response");
                }
                return response.json();
            })
            .then((data) => {
                console.log("Fetched tasks:", data);
                setTasks(data);
            })
            .catch((error) => console.error("Error fetching tasks:", error));
    }

    function deleteTask(id) {
        fetch(`http://localhost:3004/tasks/${id}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to delete task");
                }
                return response.json();
            })
            .then(() => {
                console.log(`Task with ID ${id} deleted`);
                fetchTasks();
            })
            .catch((error) => console.error("Error deleting task:", error));
    }

    function handleSort(key) {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }

        const sortedTasks = [...tasks].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });

        setTasks(sortedTasks);
        setSortConfig({ key, direction });
    }

    const filteredTasks = tasks.filter(task =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

    return (
        <>
            <h2 className="text-center mb-3">List of Tasks</h2>
            <button onClick={() => props.showForm({})} type="button" className="btn btn-primary me-2">Create</button>
            <button onClick={fetchTasks} type="button" className="btn btn-outline me-2">Refresh</button>
            <div className="mb-3">
            <input
                type="text"
                className="form-control my-3"
                placeholder="Search by Task Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <table className="table">
            <thead>
                <tr>
                    {["id", "name", "epic_id", "description"].map((key) => (
                        <th 
                            key={key} 
                            onClick={() => handleSort(key)} 
                            className="cursor-pointer"
                            style={{ userSelect: "none" }} 
                        >
                            {key.toUpperCase()}{" "}
                            {sortConfig.key === key 
                                ? (sortConfig.direction === "asc" ? "▲" : "▼") 
                                : (sortConfig.key === null && key === "id" ? "▼" : "") 
                            }
                        </th>
                    ))}
                    <th>Action</th>
                </tr>
            </thead>


                <tbody>
                    {currentTasks.map((task, index) => (
                        <tr key={index}>
                            <td>{task.id}</td>
                            <td>{task.name}</td>
                            <td>{task.epic_id}</td>
                            <td>{task.description}</td>
                            <td style={{ width: "10px", whiteSpace: "nowrap" }}>
                                <button onClick={() => props.showForm(task)} type="button" className="btn btn-primary btn-sm me-2">Edit</button>
                                <button onClick={() => deleteTask(task.id)} type="button" className="btn btn-danger btn-sm">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>


            <div className="d-flex justify-content-center">
                <button 
                    className="btn btn-secondary me-2" 
                    onClick={() => setCurrentPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span className="align-self-center">Page {currentPage} of {totalPages}</span>
                <button 
                    className="btn btn-secondary ms-2" 
                    onClick={() => setCurrentPage(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        </>
    );
}



function TaskForm(props) {
    const [errorMessage, setErrorMessage] = useState("");
    const [epicId, setEpicId] = useState(""); // Novi state za unos epic_id

    function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const task = Object.fromEntries(formData.entries());
        task.epic_id = parseInt(task.epic_id); // Osiguraj da je epic_id celobrojni

        // Ako epic_id postoji, koristi ga, a ako ne, postavi poruku o grešci
        if (task.epic_id) {
            submitTask(task);
        } else {
            setErrorMessage("Please provide a valid Epic ID.");
        }
    }

    function submitTask(task) {
        if (props.task.id) {
            // Ako je zadatak već postoji, ažuriraj ga
            fetch(`http://localhost:3004/tasks/${props.task.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(task)
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network error");
                    }
                    return response.json();
                })
                .then(() => props.showList())
                .catch((error) => console.error("Error", error));
        } else {
            // Ako je novi zadatak, samo ga postavi
            fetch("http://localhost:3004/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(task),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network error");
                    }
                    return response.json();
                })
                .then(() => props.showList())
                .catch((error) => console.error("Error", error));
        }
    }

    return (
        <>
            <h2 className="text-center mb-3">{props.task.id ? "Edit Task" : "Create New Task"}</h2>

            <div className="row">
                <div className="col-lg-6 mx-auto">
                    {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                    <form onSubmit={(event) => handleSubmit(event)}>
                        {props.task.id && (
                            <div className="row mb-3">
                                <label className="col-sm-4 col-form-label">ID</label>
                                <div className="col-sm-8">
                                    <input readOnly className="form-control-plaintext" name="id" defaultValue={props.task.id} />
                                </div>
                            </div>
                        )}

                        <div className="row mb-3">
                            <label className="col-sm-4 col-form-label">Task Name</label>
                            <div className="col-sm-8">
                                <input className="form-control" name="name" defaultValue={props.task.name} />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <label className="col-sm-4 col-form-label">Epic ID</label>
                            <div className="col-sm-8">
                                <input 
                                    className="form-control" 
                                    type="number"
                                    name="epic_id" 
                                    value={epicId} 
                                    onChange={(e) => setEpicId(e.target.value)} 
                                    placeholder="Epic ID" 
                                />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <label className="col-sm-4 col-form-label">Description</label>
                            <div className="col-sm-8">
                                <textarea className="form-control" name="description" defaultValue={props.task.description} />
                            </div>
                        </div>

                        <div className="row">
                            <div className="offset-sm-4 col-sm-4 d-grid">
                                <button type="submit" className="btn btn-primary btn-sm me-3">Save</button>
                            </div>
                            <div className="col-sm-4 d-grid">
                                <button onClick={() => props.showList()} type="button" className="btn btn-secondary me-2">Cancel</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

