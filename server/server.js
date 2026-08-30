require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensaje: "Servidor AVAsena funcionando"
    });
});

app.use("/api/aprendices", require("./routes/aprendices"));
app.use("/api/resultados", require("./routes/resultados"));
app.use("/api/actividades", require("./routes/actividades"));
app.use("/api/acceso", require("./routes/acceso"));
app.use("/api/quizzes", require("./routes/quizzes"));

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor AVAsena ejecutándose en http://localhost:${PORT}`);
    });
});

