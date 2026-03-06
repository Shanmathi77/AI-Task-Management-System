import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./kanban.css";

const COLUMNS = [
  { id: "pending", title: "Todo" },
  { id: "running", title: "In Progress" },
  { id: "done", title: "Done" },
];

const normalizeStatus = (status) => {
  if (!status || status.trim() === "") return "pending";
  if (status === "in_progress") return "running";
  if (status === "completed") return "done";
  return status;
};

export default function KanbanBoardDnd({ tasks = [], runningTaskId = null, onTasksChange = () => {} }) {
  console.log("KANBAN TASKS 👉", tasks);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const taskId = result.draggableId; // always string
    const newStatus = result.destination.droppableId;

    const updated = tasks.map((t) =>
      String(t.id) === taskId
        ? { ...t, status: newStatus }
        : { ...t, status: normalizeStatus(t.status) }
    );

    onTasksChange(updated);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <Droppable key={col.id} droppableId={col.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`kanban-column ${col.id}`}
              >
                <h3 className="kanban-title">{col.title}</h3>

                {tasks
                  .map((t) => ({ ...t, status: normalizeStatus(t.status) }))
                  .filter((t) => t.status === col.id)
                  .map((task, index) => {
                    // Ensure unique key / draggableId
                    const key = task.id ? `task_${task.id}` : `temp_${index}_${Date.now()}`;
                    const draggableId = task.id ? String(task.id) : key;

                    return (
                      <Draggable key={key} draggableId={draggableId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-task
                              ${runningTaskId === task.id ? "task-running" : ""}
                              ${snapshot.isDragging ? "dragging" : ""}
                            `}
                          >
                            {task.title}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
