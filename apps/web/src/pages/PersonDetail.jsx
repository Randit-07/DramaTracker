import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { movies as moviesApi } from "../api";

export default function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    moviesApi.getPerson(id).then((d) => setPerson(d)).catch(() => setPerson(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!person) return <div>Person not found</div>;

  return (
    <div className="detail-page">
      <h1>{person.name}</h1>
      {person.profile_path && <img src={person.profile_path} alt={person.name} style={{ maxWidth: 200 }} />}
      <p>{person.biography}</p>
    </div>
  );
}
