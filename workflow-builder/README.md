# README.md

# Workflow Builder

## Overview

This project is a simple workflow builder UI built using Angular. Users can drag and drop dummy nodes onto a canvas and connect them visually to form a basic flow. The application allows for the creation of workflows with different node types, including Start, Action 1, Action 2, and End nodes.

## How to Run the Project

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd workflow-builder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   ng serve
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:4200
   ```

## Design and Architecture Decisions

- **Component Structure:** The application is structured into several components, including a sidebar for node selection, a canvas for node placement, and individual node components for each type of node. This modular approach enhances maintainability and scalability.

- **Drag and Drop Functionality:** The drag-and-drop feature is implemented to allow users to easily place nodes on the canvas. A dedicated service manages the drag-and-drop logic to keep the components decoupled.

- **Node Connections:** Connections between nodes are visually represented with lines/arrows, and the connection logic is handled in a separate connector component.

- **Models and Services:** The application uses TypeScript models to define the structure of nodes and connections, while services manage the workflow logic, including saving and loading workflows from JSON.

This project aims for clarity and usability, focusing on a clean UI and straightforward code organization.