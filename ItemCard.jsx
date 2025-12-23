import { useNavigate } from "react-router-dom";
import "./ItemCard.css";

const ItemCard = ({ item }) => {
  const navigate = useNavigate();

  return (
    <div className="card">
      <h3>{item.title}</h3>
      <p>📍 Location: {item.location}</p>
      <p>📦 Status: {item.status}</p>

      <button onClick={() => navigate(`/item/${item.id}`)}>
        View Details
      </button>
    </div>
  );
};

export default ItemCard;
        