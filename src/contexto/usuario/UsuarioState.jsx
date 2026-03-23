import axios from "axios";
import React, { useState, useEffect } from "react";
import { useSessionStorage } from "../storage/useSessionStorage";
import {
    ProductosListar,
    CategoriaListar,
    LotesListar,
    SalidaListar,
    SucursalesListar,
    UsuariosListar,
} from "../../configuracion/apiUrls";
import { UsuarioContext } from "./UsuarioContext";

const UsuarioState = (props) => {
    // --- Sesión ---
    const [usuario, setUsuario] = useSessionStorage("usuario_almacenado", null);
    const [token, setToken] = useSessionStorage("toke_almacenado", null);

    // --- Listas ---
    const [listaProductos, setListaProductos] = useState([]);
    const [listaCategorias, setListaCategorias] = useState([]);
    const [listaLotes, setListaLotes] = useState([]);
    const [listaSalida, setListaSalida] = useState([]);
    const [listaSucursales, setListaSucursales] = useState([]);
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [actualizar, setActualizar] = useState(false);

    useEffect(() => {
        if (token) Lista();
    }, [token]);

    // --- Autenticación ---
    const setCerrarSesion = () => {
        setUsuario(null);
        setToken(null);
    };

    const setLogin = async (data) => {
        try {
            setUsuario(data.usuario);
            setToken(data.token);
        } catch (error) {
            console.log(error);
        }
    };

    // --- Carga inicial de listas ---
    const Lista = async () => {
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const cargar = async (url, setter) => {
            try {
                const res = await axios.get(url, config);
                setter(res.data || []);
            } catch (error) {
                console.error(`Error al cargar ${url}:`, error);
            }
        };

        await Promise.all([
            cargar(ProductosListar, setListaProductos),
            cargar(CategoriaListar, setListaCategorias),
            cargar(LotesListar, setListaLotes),
            cargar(SalidaListar, setListaSalida),
            cargar(SucursalesListar, setListaSucursales),
            cargar(UsuariosListar, setListaUsuarios),
        ]);
    };

    const ActualizarLista = async (url, setDatos) => {
        if (!token) return [];
        try {
            const respuesta = await axios.get(url);
            const data = respuesta.data || [];
            setDatos(data);
            return data;
        } catch (error) {
            console.error(`Error al actualizar la lista desde ${url}:`, error);
            setDatos([]);
            return [];
        }
    };

    return (
        <UsuarioContext.Provider
            value={{
                // Sesión
                usuario,
                token,
                setLogin,
                setCerrarSesion,

                // Listas
                listaProductos,
                listaCategorias,
                listaLotes,
                listaSalida,
                listaSucursales,
                listaUsuarios,
                actualizar,

                // Setters
                setActualizar,
                setListaProductos,
                setListaCategorias,
                setListaLotes,
                setListaSalida,
                setListaSucursales,
                setListaUsuarios,

                // Funciones
                Lista,
                ActualizarLista,
            }}
        >
            {props.children}
        </UsuarioContext.Provider>
    );
};

export default UsuarioState;