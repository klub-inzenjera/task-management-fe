import React, { useEffect, useState } from "react";

export function Epic() {
    const [content, setContent] = useState(<EpicList showForm={showForm} />);
    
    function showList() {
        setContent(<EpicList showForm={showForm} />);
    }
    
    function showForm(epic) {
        setContent(<EpicForm epic={epic} showList={showList} />);
    }

    return (
        <div className="container my-5">
            {content}
        </div>
    );
}

function EpicList(props) {
    const [epics, setEpics] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => fetchEpics(), []);

    function fetchEpics() {
        fetch("http://localhost:3004/epics")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Unexpected server response");
                }
                return response.json();
            })
            .then((data) => {
                console.log("Fetched epics:", data);
                setEpics(data);
            })
            .catch((error) => console.error("Error fetching epics:", error));
    }
    
    function deleteEpic(id) {
        fetch(`http://localhost:3004/epics/${id}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to delete epic");
                }
                return response.json();
            })
            .then(() => {
                console.log(`Epic with ID ${id} deleted`);
                fetchEpics();
            })
            .catch((error) => console.error("Error deleting epic:", error));
    }

    function handleSort(key) {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }

        const sortedEpics = [...epics].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });

        setEpics(sortedEpics);
        setSortConfig({ key, direction });
    }

    const filteredEpics = epics.filter((epic) =>
        epic.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEpics = filteredEpics.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(epics.length / itemsPerPage);

    return (
        <>
            <h2 className="text-center mb-3">List of Epics</h2>
            <button onClick={() => props.showForm({})} type="button" className="btn btn-primary me-2">Create</button>
            <button onClick={() => fetchEpics()} type="button" className="btn btn-outline me-2">Refresh</button>
            <div className="mb-3">
            <input
                type="text"
                className="form-control"
                placeholder="Search by Epic Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <table className="table">
            <thead>
                <tr>
                    {["id", "name", "description"].map((key) => (
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
                    {currentEpics.map((epic, index) => (
                        <tr key={index}>
                            <td>{epic.id}</td>
                            <td>{epic.name}</td>
                            <td>{epic.description}</td>
                            <td style={{ width: "10px", whiteSpace: "nowrap" }}>
                                <button onClick={() => props.showForm(epic)} type="button" className="btn btn-primary btn-sm me-2">Edit</button>
                                <button onClick={() => deleteEpic(epic.id)} type="button" className="btn btn-danger btn-sm">Delete</button>
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

function EpicForm(props) {
    const [errorMessage, setErrorMessage] = useState("");

    function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const epic = Object.fromEntries(formData.entries());

        if (props.epic.id) {
            fetch(`http://localhost:3004/epics/${props.epic.id}`, {
                method: "PATCH", 
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(epic)
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
            //epic.createdAt = new Date().toISOString().slice(0, 10);
            fetch("http://localhost:3004/epics", {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(epic)
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
            <h2 className="text-center mb-3">{props.epic.id ? "Edit Epic" : "Create New Epic"}</h2>
            
            <div className="row">
                <div className="col-lg-6 mx-auto">
                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                    <form onSubmit={(event) => handleSubmit(event)}>
                        {props.epic.id && (
                            <div className="row mb-3">
                                <label className="col-sm-4 col-form-label">ID</label>
                                <div className="col-sm-8">
                                    <input readOnly className="form-control-plaintext" name="id" defaultValue={props.epic.id} />
                                </div>
                            </div>
                        )}

                        <div className="row mb-3">
                            <label className="col-sm-4 col-form-label">Epic Name</label>
                            <div className="col-sm-8">
                                <input className="form-control" name="name" defaultValue={props.epic.name} />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <label className="col-sm-4 col-form-label">Description</label>
                            <div className="col-sm-8">
                                <textarea className="form-control" name="description" defaultValue={props.epic.description} />
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
