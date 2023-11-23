const express = require("express");
const app = express();
const mysql = require("mysql");

let conection = mysql.createConnection({
    host: "mysql-sirmauricio.alwaysdata.net",
    database: "sirmauricio_medicina",
    user: "336858_mauricio",
    password: "Jorger0:v"
});

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//Ruta para el campo nombre que extrae todos los nombres de la tabla medicinas
app.get("/", function (req, res) {
    conection.query("SELECT nombre FROM medicina", function (error, results) {
        if (error) {
            throw error;
        } else {
            const nombreMedicamento = results.map(result => result.nombre);
            res.render("registro", { nombreMedicamento });
        }
    });
});


// Ruta para procesar el formulario y redireccionar a la página de la tabla
app.post("/validar", function (req, res) {
    const datos = req.body;
    console.log("Datos recibidos:", datos);

    let nombre = datos.nombre;
    let dosis = datos.dosis;
    let toma = datos.toma;
    let fecha = datos.fecha;
    let hora = datos.hora;
    let comentarios = datos.comentarios;

    let registrar = "INSERT INTO listamedicina (nombreMedicina, dosis, toma, fecha, hora, comentarios) VALUES (?, ?, ?, ?, ?, ?)";

    conection.query(registrar, [nombre, dosis, toma, fecha, hora, comentarios], function (error) {
        if (error) {
            throw error;
        } else {
            console.log("Datos almacenados correctamente");
            res.redirect("./mostrarDatos"); // Redirecciona a la ruta que muestra los datos
        }
    });
});

// Ruta para mostrar los datos de la tabla listamedicina
// Ruta para mostrar los datos en una tabla
app.get("/mostrarDatos", function (req, res) {
    let resultados = {};

    conection.query("SELECT * FROM listamedicina", function (errorListamedicina, resultsListamedicina) {
        if (errorListamedicina) {
            throw errorListamedicina;
        } else {
            resultados.listamedicina = resultsListamedicina;

            conection.query("SELECT * FROM temprano", function (errorTemprano, resultsTemprano) {
                if (errorTemprano) {
                    throw errorTemprano;
                } else {
                    resultados.temprano = resultsTemprano;

                    conection.query("SELECT * FROM tarde", function (errorTarde, resultsTarde) {
                        if (errorTarde) {
                            throw errorTarde;
                        } else {
                            resultados.tarde = resultsTarde;

                            conection.query("SELECT * FROM noche", function (errorNoche, resultsNoche) {
                                if (errorNoche) {
                                    throw errorNoche;
                                } else {
                                    resultados.noche = resultsNoche;

                                    conection.query("SELECT * FROM madrugada", function (errorMadrugada, resultsMadrugada) {
                                        if (errorMadrugada) {
                                            throw errorMadrugada;
                                        } else {
                                            resultados.madrugada = resultsMadrugada;

                                            conection.query("SELECT * FROM cualquier", function (errorCualquier, resultsCualquier) {
                                                if (errorCualquier) {
                                                    throw errorCualquier;
                                                } else {
                                                    resultados.cualquier = resultsCualquier;

                                                    res.render("tablaDatos", { datos: resultados }); // Renderiza una plantilla EJS con los datos obtenidos
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});





// Nueva ruta para manejar la solicitud POST al presionar "Administrar" y hacer DELETE en la tabla lista medicina
app.post("/administrar", function (req, res) {
    const datos = req.body;
    console.log("Datos recibidos:", datos); // Verifica si los datos se están recibiendo correctamente

    let idRegistro = datos.idRegistro; // ID del registro a eliminar
    let nombre = datos.nombre;
    let dosis = datos.dosis;
    let toma = datos.toma;
    let fecha = datos.fecha;
    let hora = datos.hora;
    let comentarios = datos.comentarios;
    let horario = datos.horario;

    // Consulta para insertar datos en la tabla correspondiente según el rango horario
    let tablaDestino = '';
    const horaMoment = new Date(`2000-01-01T${hora}`); // Crear un objeto Date para manipular la hora

    if (horaMoment.getHours() >= 6 && horaMoment.getHours() < 12) {
        tablaDestino = "temprano";
    } else if (horaMoment.getHours() >= 12 && horaMoment.getHours() < 18) {
        tablaDestino = "tarde";
    } else if (horaMoment.getHours() >= 18 && horaMoment.getHours() < 24) {
        tablaDestino = "noche";
    } else {
        tablaDestino = "madrugada";
    }

    // Consulta para insertar datos en la tabla correspondiente
    let registrarEnTabla = `INSERT INTO ${tablaDestino} (nombreMedicina, dosis, toma, fecha, hora, comentarios, horario) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    let eliminarDeListaMedicina = "DELETE FROM listamedicina WHERE nombreMedicina = ?"; // Consulta para eliminar datos de listamedicina por ID

    conection.beginTransaction(function(err) {
        if (err) { throw err; }

        conection.query(registrarEnTabla, [nombre, dosis, toma, fecha, hora, comentarios, tablaDestino], function (error) {
            if (error) {
                conection.rollback(function() {
                    throw error;
                });
            } else {
                conection.query(eliminarDeListaMedicina, [nombre], function(err, result) {
                    if (err) {
                        conection.rollback(function() {
                            throw err;
                        });
                    } else {
                        conection.commit(function(err) {
                            if (err) {
                                conection.rollback(function() {
                                    throw err;
                                });
                            }
                            console.log(`Datos almacenados en la tabla '${tablaDestino}' y eliminados de 'listamedicina' correctamente`);
                            res.redirect("/mostrarDatos"); // Redirecciona a la ruta que muestra los datos
                        });
                    }
                });
            }
        });
    });
});



// Nueva ruta para manejar la solicitud POST al presionar "Tomar" y hacer DELETE en la tabla lista de donde provenía
app.post("/tomarTemprano", function (req, res) {
    const datos = req.body;
    console.log("Datos recibidos:", datos);

    let nombre = datos.nombre;
    let dosis = datos.dosis;
    let toma = datos.toma;
    let fecha = datos.fecha;
    let hora = datos.hora;
    let comentarios = datos.comentarios;
    let horario = datos.horario;

    let horaActual = parseInt(hora); // Guarda la hora actual como un número entero

    // Suma el valor del campo 'toma' al valor del campo 'hora', cuidando el rango de horas
    let horaActualizada = (horaActual + parseInt(toma)) % 24; // Obtiene el resto de dividir por 24 para reiniciar en caso de ser mayor o igual a 24

    // Consulta para insertar datos en la tabla correspondiente según el rango horario
    let tablaDestino = '';
    const horaMoment = new Date(`2000-01-01T${horaActualizada}`);

    if (horaMoment.getHours() >= 6 && horaMoment.getHours() < 12) {
        tablaDestino = "temprano";
    } else if (horaMoment.getHours() >= 12 && horaMoment.getHours() < 18) {
        tablaDestino = "tarde";
    } else if (horaMoment.getHours() >= 18 && horaMoment.getHours() < 24) {
        tablaDestino = "noche";
    } else {
        tablaDestino = "madrugada";
    }

    // Consulta para eliminar datos de la tabla correspondiente al horario
   let registrarEnTabla = `INSERT INTO ${tablaDestino} (nombreMedicina, dosis, toma, fecha, hora, comentarios, horario) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    let eliminarDeTablaHorario = `DELETE FROM temprano WHERE nombreMedicina = ?`; // Consulta para eliminar datos de la tabla correspondiente al horario

    conection.beginTransaction(function(err) {
        if (err) { throw err; }

        conection.query(registrarEnTabla, [nombre, dosis, toma, fecha, horaActualizada, comentarios, tablaDestino], function (error) {
            if (error) {
                conection.rollback(function() {
                    throw error;
                });
            } else {
                conection.query(eliminarDeTablaHorario, [nombre], function(err, result) {
                    if (err) {
                        conection.rollback(function() {
                            throw err;
                        });
                    } else {
                        conection.commit(function(err) {
                            if (err) {
                                conection.rollback(function() {
                                    throw err;
                                });
                            }
                            console.log(`Datos almacenados en la tabla '${tablaDestino}' y eliminados de la tabla '${tablaDestino}' correctamente`);
                            res.redirect("/mostrarDatos"); // Redirecciona a la ruta que muestra los datos
                        });
                    }
                });
            }
        });
    });
});


//Tomar de la tabla tarde

app.post("/tomarTarde", function (req, res) {
    const datos = req.body;
    console.log("Datos recibidos:", datos); // Verifica si los datos se están recibiendo correctamente

    let nombre = datos.nombre;
    let dosis = datos.dosis;
    let toma = datos.toma;
    let fecha = datos.fecha;
    let hora = datos.hora;
    let comentarios = datos.comentarios;
    let horario = datos.horario // Se agregó el campo horario

    // Sumar el valor del campo 'toma' al valor del campo 'hora'
    let horaActualizada = parseInt(hora) + parseInt(toma);

    // Consulta para insertar datos en la tabla correspondiente según el rango horario
    let tablaDestino = '';
    const horaMoment = new Date(`2000-01-01T${horaActualizada}`); // Crear un objeto Date para manipular la hora actualizada

    if (horaMoment.getHours() >= 6 && horaMoment.getHours() < 12) {
        tablaDestino = "temprano";
    } else if (horaMoment.getHours() >= 12 && horaMoment.getHours() < 18) {
        tablaDestino = "tarde";
    } else if (horaMoment.getHours() >= 18 && horaMoment.getHours() < 24) {
        tablaDestino = "noche";
    } else {
        tablaDestino = "madrugada";
    }

    // Consulta para eliminar datos de la tabla correspondiente al horario
   let registrarEnTabla = `INSERT INTO ${tablaDestino} (nombreMedicina, dosis, toma, fecha, hora, comentarios, horario) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    let eliminarDeTablaHorario = `DELETE FROM tarde WHERE nombreMedicina = ?`; // Consulta para eliminar datos de la tabla correspondiente al horario

    conection.beginTransaction(function(err) {
        if (err) { throw err; }

        conection.query(registrarEnTabla, [nombre, dosis, toma, fecha, horaActualizada, comentarios, tablaDestino], function (error) {
            if (error) {
                conection.rollback(function() {
                    throw error;
                });
            } else {
                conection.query(eliminarDeTablaHorario, [nombre], function(err, result) {
                    if (err) {
                        conection.rollback(function() {
                            throw err;
                        });
                    } else {
                        conection.commit(function(err) {
                            if (err) {
                                conection.rollback(function() {
                                    throw err;
                                });
                            }
                            console.log(`Datos almacenados en la tabla '${tablaDestino}' y eliminados de la tabla '${tablaDestino}' correctamente`);
                            res.redirect("/mostrarDatos"); // Redirecciona a la ruta que muestra los datos
                        });
                    }
                });
            }
        });
    });
});


//Tomar noche
app.post("/tomarNoche", function (req, res) {
    const datos = req.body;
    console.log("Datos recibidos:", datos); // Verifica si los datos se están recibiendo correctamente

    let nombre = datos.nombre;
    let dosis = datos.dosis;
    let toma = datos.toma;
    let fecha = datos.fecha;
    let hora = datos.hora;
    let comentarios = datos.comentarios;
    let horario = datos.horario // Se agregó el campo horario

    // Sumar el valor del campo 'toma' al valor del campo 'hora'
    let horaActualizada = parseInt(hora) + parseInt(toma);

    // Consulta para insertar datos en la tabla correspondiente según el rango horario
    let tablaDestino = '';
    const horaMoment = new Date(`2000-01-01T${horaActualizada}`); // Crear un objeto Date para manipular la hora actualizada

    if (horaMoment.getHours() >= 6 && horaMoment.getHours() < 12) {
        tablaDestino = "temprano";
    } else if (horaMoment.getHours() >= 12 && horaMoment.getHours() < 18) {
        tablaDestino = "tarde";
    } else if (horaMoment.getHours() >= 18 && horaMoment.getHours() < 24) {
        tablaDestino = "noche";
    } else {
        tablaDestino = "madrugada";
    }

    // Consulta para eliminar datos de la tabla correspondiente al horario
   let registrarEnTabla = `INSERT INTO ${tablaDestino} (nombreMedicina, dosis, toma, fecha, hora, comentarios, horario) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    let eliminarDeTablaHorario = `DELETE FROM noche WHERE nombreMedicina = ?`; // Consulta para eliminar datos de la tabla correspondiente al horario

    conection.beginTransaction(function(err) {
        if (err) { throw err; }

        conection.query(registrarEnTabla, [nombre, dosis, toma, fecha, horaActualizada, comentarios, tablaDestino], function (error) {
            if (error) {
                conection.rollback(function() {
                    throw error;
                });
            } else {
                conection.query(eliminarDeTablaHorario, [nombre], function(err, result) {
                    if (err) {
                        conection.rollback(function() {
                            throw err;
                        });
                    } else {
                        conection.commit(function(err) {
                            if (err) {
                                conection.rollback(function() {
                                    throw err;
                                });
                            }
                            console.log(`Datos almacenados en la tabla '${tablaDestino}' y eliminados de la tabla '${tablaDestino}' correctamente`);
                            res.redirect("/mostrarDatos"); // Redirecciona a la ruta que muestra los datos
                        });
                    }
                });
            }
        });
    });
});


//Tomar Madrugada
app.post("/tomarMadrugada", function (req, res) {
    const datos = req.body;
    console.log("Datos recibidos:", datos); // Verifica si los datos se están recibiendo correctamente

    let nombre = datos.nombre;
    let dosis = datos.dosis;
    let toma = datos.toma;
    let fecha = datos.fecha;
    let hora = datos.hora;
    let comentarios = datos.comentarios;
    let horario = datos.horario // Se agregó el campo horario

    // Sumar el valor del campo 'toma' al valor del campo 'hora'
    let horaActualizada = parseInt(hora) + parseInt(toma);

    // Consulta para insertar datos en la tabla correspondiente según el rango horario
    let tablaDestino = '';
    const horaMoment = new Date(`2000-01-01T${horaActualizada}`); // Crear un objeto Date para manipular la hora actualizada

    if (horaMoment.getHours() >= 6 && horaMoment.getHours() < 12) {
        tablaDestino = "temprano";
    } else if (horaMoment.getHours() >= 12 && horaMoment.getHours() < 18) {
        tablaDestino = "tarde";
    } else if (horaMoment.getHours() >= 18 && horaMoment.getHours() < 24) {
        tablaDestino = "noche";
    } else {
        tablaDestino = "madrugada";
    }

    // Consulta para eliminar datos de la tabla correspondiente al horario
   let registrarEnTabla = `INSERT INTO ${tablaDestino} (nombreMedicina, dosis, toma, fecha, hora, comentarios, horario) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    let eliminarDeTablaHorario = `DELETE FROM madrugada WHERE nombreMedicina = ?`; // Consulta para eliminar datos de la tabla correspondiente al horario

    conection.beginTransaction(function(err) {
        if (err) { throw err; }

        conection.query(registrarEnTabla, [nombre, dosis, toma, fecha, horaActualizada, comentarios, tablaDestino], function (error) {
            if (error) {
                conection.rollback(function() {
                    throw error;
                });
            } else {
                conection.query(eliminarDeTablaHorario, [nombre], function(err, result) {
                    if (err) {
                        conection.rollback(function() {
                            throw err;
                        });
                    } else {
                        conection.commit(function(err) {
                            if (err) {
                                conection.rollback(function() {
                                    throw err;
                                });
                            }
                            console.log(`Datos almacenados en la tabla '${tablaDestino}' y eliminados de la tabla '${tablaDestino}' correctamente`);
                            res.redirect("/mostrarDatos"); // Redirecciona a la ruta que muestra los datos
                        });
                    }
                });
            }
        });
    });
});


app.listen(3000, function () {
    console.log("Servidor creado http://localhost:3000");
});
