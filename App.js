import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css"; // import the css file

const API_URL = "http://localhost:5000/students";

function App() {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    course: "",
    age: "",
    address: "",
  });
  const [students, setStudents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const response = await axios.get(API_URL);
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle form change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //why is it cathing error when I try to add a student?

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending data:", formData); // Debugging
      const { id, name, course, age, address } = formData; // Ensure these are extracted correctly
      await axios.post("http://localhost:5000/students", {
        id,
        name,
        course,
        age,
        address,
      });
      alert("Student added successfully!");
    } catch (error) {
      console.error(
        "❌ Error adding student:",
        error.response?.data || error.message
      );
    }
  };

  // Update existing student
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${formData.id}`, formData);
      toast.success("Student updated successfully!");
      fetchStudents();
      setFormData({
        id: "",
        name: "",
        course: "",
        age: "",
        address: "",
      });
      setIsEditing(false);
    } catch (error) {
      toast.error("Error updating student!");
    }
  };

  // Delete student
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Student deleted!");
      fetchStudents();
    } catch (error) {
      toast.error("Error deleting student!");
    }
  };

  // Populate form for updating student
  const handleEdit = (student) => {
    setFormData(student);
    setIsEditing(true);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${API_URL}/${formData.id}`);
      setStudents([response.data]);
    } catch (error) {
      toast.error("Student not found!");
    }
  };
  // how to upload a csv file
  // its always showing error
  //
  const handleCSVUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", e.target[0].files[0]); // get the first file from the input

    try {
      await axios.post(`${API_URL}/upload`, formData);
      toast.success("CSV uploaded successfully!");
      fetchStudents();
    } catch (error) {
      toast.error("Error uploading CSV!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user ? user.username : "Unknown";
  const role = user ? user.role : "Unknown";
  //search button makes the ID in table disappear
  //make the ID still APPEAR when a user searches an ID in the search bar
  //where should I do that?  in the handleSearch function
  //
  return (
    <div className="container" style={{ textAlign: "center" }}>
      <h1>Student CRUD with Redis</h1>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          name="id"
          placeholder="Search by ID"
          value={formData.id}
          onChange={handleChange}
          required
        />
        <button type="submit">Search</button>
      </form>
      <br />
      <form onSubmit={handleCSVUpload}>
        <input type="file" name="file" required />
        <button type="submit">Upload CSV</button>
      </form>
      {!isEditing ? (
        <form onSubmit={handleAddSubmit}>
          <input
            type="text"
            name="id"
            placeholder="ID"
            value={formData.id}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="course"
            placeholder="Course"
            value={formData.course}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <button id="submit-button" type="submit">
            Add Student
          </button>
        </form>
      ) : (
        <form onSubmit={handleEditSubmit}>
          <input
            type="text"
            name="id"
            placeholder="ID"
            value={formData.id}
            onChange={handleChange}
            required
            disabled
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="course"
            placeholder="Course"
            value={formData.course}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <button type="submit">Update Student</button>
        </form>
      )}
      <br />
      <table border="1" align="center" style={{ width: "80%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Course</th>
            <th>Age</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.name}</td>
              <td>{student.course}</td>
              <td>{student.age}</td>
              <td>{student.address}</td>
              <td>
                <button
                  className="edit-button"
                  onClick={() => handleEdit(student)}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(student.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ToastContainer />
    </div>
  );
}
export default App;
