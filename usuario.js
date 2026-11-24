
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

import { db } from "./firebase.js";


// ============================
// REGISTRAR USUÁRIO NO FIRESTORE
// ============================

export async function registrarUsuario(usuario) {

    if (!usuario) return;

    const referenciaUsuario = doc(
        db,
        "usuarios",
        usuario.uid
    );

    const documento = await getDoc(referenciaUsuario);

    const dadosUsuario = {
        nome: usuario.displayName || "",
        email: usuario.email || ""
    };

    if (documento.exists()) {

        // ATUALIZAR DADOS SEM ALTERAR A DATA DE CRIAÇÃO

        await setDoc(referenciaUsuario, dadosUsuario, {
            merge: true
        });

    } else {

        // CRIAR NOVO USUÁRIO

        await setDoc(referenciaUsuario, {
            ...dadosUsuario,
            criadoEm: serverTimestamp()
        });

    }

}
