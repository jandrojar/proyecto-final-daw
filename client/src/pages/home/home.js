import { scrollToElementId, parseTipo, colorAleatorio, handleSkeleton, showErrorMessage, checkIfImgExists } from '../../../js/helper.js'
import handleFetchData from '../../../js/service/services.js'
import { checkValidContent } from '../../../js/validation.js'

const tipos = {
    "ilu": "Iluminación",
    "deco": "Estilos decoración",
    "mobi": "Mobiliario",
    "text": "Textiles",
    "acc": "Accesorios"
};

document.addEventListener("DOMContentLoaded", async () => {
    const userSession = JSON.parse(localStorage.getItem("responseData"));
    setTimeout(async () => {
        handleSkeleton();

        const getPosts = await handleFetchData({
            action: "post-get-all",
            filterbytype: "all",
            filterbyuser: "allUsers",
        });

        if(getPosts.success) {
            setPosts(getPosts.data);
        } else {
            emptyPosts();
        }

        const filters = await handleFetchData({
            action: "filter-get-posts-types",
        });

        if (filters.success  && Array.isArray(filters.data)) {
            const parseFilters = filters.data.map(item =>parseTipo(item.tipo));
            localStorage.setItem('filters', parseFilters);
            setSelectTypeOptions(filters.data, 'filter-type-select');

            if(userSession) {
                setSelectUser();
            }
        }
    }, 2000);

    const addPostBtn = document.getElementById("add-post-button");
    addPostBtn.onclick = () => handleAddPost();

    if (userSession && addPostBtn) {
      addPostBtn.classList.remove("hidden");
    }
});
// Añadimos las opciones de manera dinámica
export function setSelectTypeOptions(data, id) {
    const select = document.getElementById(id);
    const selectUserType = document.getElementById("filter-user-select");
    let currentUser = JSON.parse(localStorage.getItem('responseData'));
    // Borrar duplicados
    const uniqueArray = [...new Set(data)];
    uniqueArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item.tipo;
        option.textContent = parseTipo(item.tipo);
        select.appendChild(option);
    });
    select.addEventListener('change', async (event) => {
        handleSkeleton();
        const filters = await handleFetchData(
        {
            action: "post-get-all",
            filterbytype: event.target.value,
            filterbyuser: selectUserType.value || 'allUsers',
            userId: currentUser?.id_usuario || null,
        });
        setTimeout(() => {
            if(filters.success) {
                setPosts(filters.data);
            } else {
                emptyPosts();
            }
            handleSkeleton();
        }, 100);
    }
    );
}

// Añadimos event
export function setSelectUser() {
    document.getElementById("filter-user-select-container").classList.remove('hidden');
    const select = document.getElementById("filter-user-select");
    const selectTypeValue = document.getElementById("filter-type-select");
    let currentUser = JSON.parse(localStorage.getItem('responseData'));


    select.addEventListener('change', async (event) => {
        handleSkeleton();
        const filters = await handleFetchData(
        {
            action: "post-get-all",
            filterbytype: selectTypeValue.value,
            filterbyuser: event.target.value,
            userId: currentUser.id_usuario,
        });
        setTimeout(() => {
            if(filters.success) {
                handleSkeleton();
                setPosts(filters.data);
            } else {
                handleSkeleton();
                emptyPosts();
            }
        }, 100);
    })
}

const closeModal = (id) => {
    const modal = document.getElementById(id);
    modal.style.display = "none";
};

/**  POSTS **/
async function setPosts(data) {
    try {
        // Primero limpiamos y luego añadimos los posts
        const postsContainer = document.getElementById('posts-container');
        postsContainer.innerHTML = '';

        // Pedimos los comentarios
        const comments = await handleFetchData({ action: "comments-get-all",});

        data.forEach(async (post, index) => {
            // Filtramos  los comentarios
            const commentsFiltered = comments.data.filter(comment => comment.id_post === post.id_post);

            // Crear card
            const card = document.createElement('div');
            card.classList.add('card');
            card.id = `card-${post.id_post}`;
            const userSession = JSON.parse(localStorage.getItem('responseData'));

            // Crear imagen de la card por tipo
            const postImg = document.createElement('img');
            postImg.classList.add('card-image-type');
            postImg.alt = 'post image';
            postImg.src = `client/assets/tipos/${post.tipo}.jpg`;
            card.appendChild(postImg);

            if(checkIfImgExists(`client/assets/users/user-${post.autor_id}.jpg`)) {
                // Crear imagen del usuario
                const userImg = document.createElement('img');
                userImg.classList.add('image');
                userImg.classList.add('image-post');
                userImg.alt = 'user image';
                userImg.src = `client//assets/users/user-${post.autor_id}.jpg`;
                card.appendChild(userImg);
            } else {
                // Crear avatar
                const avatar = document.createElement('div');
                avatar.classList.add('avatar');
                let iniciales = post.nombre.charAt(0) + post.apellidos.charAt(0);
                iniciales = iniciales.toUpperCase();
                avatar.textContent = iniciales;
                avatar.style.backgroundColor = colorAleatorio();
                card.appendChild(avatar);
            }

            // Añadir campos a la card
            Object.entries(post).forEach((value) => {
                const file = document.createElement('p');
                file.classList.add('file');
                file.classList.add(`post-${value[0]}`);
                file.id = `post-${value[0]}-${index}`;

                if(value[0] === 'fecha_modificacion') {
                    if(!value[1]) {
                        return;
                    }
                }

                if(value[0] === 'tipo') {
                    value[1] = parseTipo(value[1]);
                }

                if(value[0] === 'rol' || value[0] === 'autor_id' || value[0] === 'id_post') {
                    return;
                }

                file.innerHTML = value[1];
                card.appendChild(file);
            });

            // Añadir número comentarios
            if(commentsFiltered.length > 0) {
                const commentsCounter = document.createElement('p');
                commentsCounter.classList.add('comments-counter');
                commentsCounter.textContent = `${commentsFiltered.length} comentarios`;
                card.appendChild(commentsCounter);
            };

            const actionsCell = document.createElement('div');
            
            if(userSession && (userSession.id_usuario === post.autor_id || userSession.rol === '0')) { 
                // Añadir las acciones
                actionsCell.id = 'post-actions-content';
                actionsCell.classList.add('actions');
                const editButton = document.createElement('button');
                editButton.textContent = 'Editar';
                editButton.classList.add('button')
                editButton.classList.add('button')
                editButton.onclick = () => editPost(post.id_post);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.classList.add('button')
                editButton.classList.add('button')
                deleteButton.onclick = () => deletePost(post.id_post);

                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
            }
            // Opcion comentar
            const commentsButton = document.createElement('button');
            commentsButton.textContent = 'Comentar';
            commentsButton.classList.add('button')
            commentsButton.classList.add('button-tertiary')
            commentsButton.onclick = () => handleShowComments(post.id_post);
            actionsCell.appendChild(commentsButton);
            card.appendChild(actionsCell);    
            postsContainer.appendChild(card)

            // Añadir comentarios
            const enrichCard = addCommentToCard(card, post.id_post, commentsFiltered);
            postsContainer.appendChild(enrichCard);
        });

    } catch (error) {
        showErrorMessage(error);
    }
}

function handleAddPost() {
    const modal = document.getElementById("editPostModal");
    document.getElementById("modalPostTitle").value = '';
    document.getElementById("modalPostContent").value = '';
    document.getElementById("modalPostId").value = '';
    document.querySelector("#editPostModal h2").textContent = 'Añadir Post';

    const addButton = document.getElementById("modalPostSave")
    addButton.textContent = 'Crear';
    addButton.onclick= () => addPost();


    const cancelAddButton = document.getElementById("modalPostCancel")
    cancelAddButton.textContent = 'Cancelar';
    cancelAddButton.onclick= () => closeModal("editPostModal");

    const select = document.getElementById("modalPostType");
    select.innerHTML = '';



    Object.entries(tipos).forEach(([valor, texto]) => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = texto;
        select.appendChild(option);
    });

    modal.style.display = "block";
}

async function addPost() {
    const userSession = JSON.parse(localStorage.getItem("responseData"));
    const title = document.getElementById("modalPostTitle").value;
    const content = document.getElementById("modalPostContent").value;
    const type = document.getElementById("modalPostType").value;

    if (!title || !content) {
        showErrorMessage('Por favor, rellena todos los campos obligatorios.');
        return;
    }

    if (!checkValidContent(content).success) {
        showErrorMessage(checkValidContent(content).message);
        return;
    }

    let actionResult = await handleFetchData({
        action: "post-add",
        titulo: title,
        contenido: content,
        tipo: type,
        autor_id: userSession.id_usuario
    });


    if (actionResult.success) {
        const ultimoObjeto = actionResult.data[actionResult.data.length - 1];
        setPosts(actionResult.data);

        setTimeout(() => {
            const newPost = document.getElementById(`card-${ultimoObjeto.id_post}`);
            newPost.classList.add('card-fade-in')
            scrollToElementId(`card-${ultimoObjeto.id_post}`)
        }, 100);
        

    } else {
        showErrorMessage("Hubo un error al procesar el post.");

    }
    document.getElementById("editPostModal").style.display = "none";

};

async function editPost(id) {
    try {
        const response = await handleFetchData({id, action: "post-get-by-id",});
        document.getElementById("modalPostTitle").value = response.data[0].titulo;
        document.getElementById("modalPostContent").value = response.data[0].contenido;
        document.getElementById("modalPostId").value = response.data[0].id_post;
        
        // Cargar las opciones del select
        const select = document.getElementById("modalPostType");
        // Limpiar opciones existentes
        select.innerHTML = '';

        // Agregar las opciones al select
        Object.entries(tipos).forEach(([valor, texto]) => {
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = texto;
            // Si es el tipo actual del post, seleccionarlo
            if (valor === response.data[0].tipo) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        const modal = document.getElementById("editPostModal");
        const closeBtn = document.getElementById("close");

        // Event listener para el botón de cierre (×)
        closeBtn.onclick =  () => closeModal("editPostModal");

        // Event listener para cerrar el modal al hacer clic fuera de él
        window.onclick = function(event) {
            if (event.target == modal) {
                closeModal("editPostModal");
            }
        };

        document.getElementById("modalPostCancel").onclick = () => closeModal("editPostModal");

        // Event listeners para los botones
        document.getElementById("modalPostSave").onclick = async () => {
            const title = document.getElementById("modalPostTitle").value;
            const content = document.getElementById("modalPostContent").value;
            const type = document.getElementById("modalPostType").value;
            const postId = document.getElementById("modalPostId").value;
            
            if (!title || !content) {
                showErrorMessage('Por favor, rellena todos los campos obligatorios.');
                return;
            }

            if(!checkValidContent(content).success) {
                const message = checkValidContent(content).message
                showErrorMessage(message);
                return;
            }

            const postUpdate = await handleFetchData(
                {
                    action: "post-update",
                    id: postId,
                    titulo: title,
                    contenido: content,
                    tipo: type,
                });
        
            if(postUpdate.success) {
                setPosts(postUpdate.data);
                setTimeout(() => {
                    scrollToElementId(`card-${postId}`)
                }, 100);
            }

            closeModal("editPostModal");
        };

        // Mostrar el modal
        modal.style.display = "block";
    } catch (error) {
        showErrorMessage(error);
    }
}

async function deletePost(id) {
    const deleteAction = await handleFetchData({
        action: "post-delete",
        id: id,
    });
    if(deleteAction.success) {
        setPosts(deleteAction.data);
    }
};

function emptyPosts() {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = 'No hay registros.';
}

/**  COMMENTS **/
function addCommentToCard(cardInfo, postId, comments) {
    const card = cardInfo || document.getElementById(`card-${postId}`); 
    
    const commentsContainer = document.createElement('div');
    commentsContainer.classList.add('comments-container');
    commentsContainer.classList.add('comments-container-close');
    commentsContainer.id = `comments-container-${postId}`;

    const commentsListContainer = document.createElement('div');
    commentsListContainer.classList.add('comments-list-container');
    commentsListContainer.id = `comments-list-container-${postId}`;

    commentsContainer.appendChild(commentsListContainer);
    card.appendChild(commentsContainer);

    comments.forEach(comment => {
        const singleComment = createSingleComment(postId, comment);
        commentsListContainer.appendChild(singleComment);
    });

    // Empty comments message
    if(!comments.length) {
        const emptyCommentText = document.createElement('p');
        emptyCommentText.classList.add('comments-empty-text');
        emptyCommentText.id = 'comments-empty-text';
        emptyCommentText.textContent = "Sé el primero en comentar";
        commentsListContainer.appendChild(emptyCommentText);
    }

    const userSession = JSON.parse(localStorage.getItem('responseData'));
    if(userSession) {
        // Input para añadir comentarios
        const sendCommentContent = document.createElement('div');
        sendCommentContent.id = 'comments-add-content';
        sendCommentContent.classList.add('comments-add-content');

        const commentInput = document.createElement('input');
        commentInput.classList.add('comment-input');
        commentInput.id = 'new-comment-input';
        commentInput.placeholder = 'Escribe un comentario...';
        sendCommentContent.appendChild(commentInput);

        const AddCommentButton = document.createElement('button');
        AddCommentButton.textContent = 'Enviar';
        AddCommentButton.classList.add('button')
        AddCommentButton.classList.add('button-primary')
        AddCommentButton.onclick = () =>addComment(postId, commentInput.value);
        sendCommentContent.appendChild(AddCommentButton);

        commentsContainer.appendChild(sendCommentContent);
    }
    return card;
};

function createSingleComment(postId, comment) {
    const userSession = JSON.parse(localStorage.getItem('responseData'));
    
    const commentCard = document.createElement('div');
    commentCard.classList.add('comment-card');
    commentCard.id = `comment-card-${comment.id_comment}`;

    const commentContentContainer = document.createElement('div');
    commentContentContainer.classList.add('comment-content-container');
    commentContentContainer.id = `comment-content-container-${comment.id_comment}`;

    if(checkIfImgExists(`client//assets/users/user-${comment.id_usuario}.jpg`)) {
        const commentUserImg = document.createElement('img');
        commentUserImg.classList.add('image');
        commentUserImg.classList.add('image--comentario');
        commentUserImg.alt = 'user image';
        commentUserImg.src = `client//assets/users/user-${comment.id_usuario}.jpg`;
        commentContentContainer.appendChild(commentUserImg);
    } else {
        const avatar = document.createElement('div');
        avatar.classList.add('avatar--comentario');
        let iniciales = comment.nombre_usuario.charAt(0) + comment.apellidos_usuario.charAt(0);
        iniciales = iniciales.toUpperCase();
        avatar.textContent = iniciales;
        avatar.style.backgroundColor = colorAleatorio();
        commentContentContainer.appendChild(avatar);
    }


    const commentContent = document.createElement('p');
    commentContent.classList.add('content');
    commentContent.id = `content-${comment.id_comment}`
    commentContent.textContent = comment.contenido;
    commentContentContainer.appendChild(commentContent);

    const creationDateContent = document.createElement('p');
    creationDateContent.classList.add('creation-date');
    creationDateContent.textContent = comment.fecha_creacion;
    commentContentContainer.appendChild(creationDateContent);

    if (comment.fecha_modificacion) {
        const editionDateContent = document.createElement('p');
        editionDateContent.classList.add('edition-date');
        editionDateContent.textContent =  `(editado: ${comment.fecha_modificacion})`;
        commentContentContainer.appendChild(editionDateContent);
    }

    commentCard.appendChild(commentContentContainer);

    if(userSession && (userSession.id_usuario === comment.id_usuario || userSession.rol === '0')) { 
        // Añadir las acciones
        const commentActionsCell = document.createElement('div');
        commentActionsCell.id = 'comments-actions-content';
        commentActionsCell.classList.add('actions');
        const editCommentButton = document.createElement('button');
        editCommentButton.textContent = 'Editar';
        editCommentButton.classList.add('button')
        editCommentButton.onclick = () => editComment(postId, comment.id_comment);

        const deleteCommentButton = document.createElement('button');
        deleteCommentButton.textContent = 'Eliminar';
        deleteCommentButton.classList.add('button')
        deleteCommentButton.onclick = () => deleteComment(comment.id_comment);

        commentActionsCell.appendChild(editCommentButton);
        commentActionsCell.appendChild(deleteCommentButton);

        commentCard.appendChild(commentActionsCell);        
    }

    return commentCard;
}

async function addComment(id_post, content) {
    if(content.trim()) {

        if(!checkValidContent(content).success) {
            const message = checkValidContent(content).message
            showErrorMessage(message);
            return;
        }

        const userSession = JSON.parse(localStorage.getItem('responseData'));
        const commentInput = document.getElementById('new-comment-input');
        commentInput.value= '';

        // Traigo los comentarios actuales
        const getPreviousComments = await handleFetchData({
            action: "comments-get-by-post-id",
            id: id_post,
        });

        // Actualizo y traigo todos los comentarios
        const updatedComments = await handleFetchData({
            action: "comments-add",
            idPost: id_post,
            content: content,
            userId: userSession.id_usuario,
        });

        if (updatedComments.success) {
            let filterNewComment;

            // En caso de que haya comentarios, filtro para extrael el nuevo.
            if(getPreviousComments.success) {
            filterNewComment =  updatedComments.data.filter(comentarioB => 
                !getPreviousComments.data.some(comentarioA => comentarioA.id_comment === comentarioB.id_comment)
            );
            } else {
                filterNewComment = updatedComments.data;
            }

            // Creamos comentario element y añadimos al DOM sin recargar.
            const comentsContainer = document.getElementById(`comments-list-container-${id_post}`);
            if(comentsContainer) {
                const newCommentElement = createSingleComment(id_post, ...filterNewComment)
                comentsContainer.appendChild(newCommentElement);
            }
            scrollToElementId(`comment-card-${filterNewComment[0].id_comment}`);
        }
    };
};

async function handleShowComments(id) {
    try {
        const commentsContainer = document.getElementById(`comments-container-${id}`);

        if (commentsContainer) {
            if(commentsContainer.classList.contains('comments-container-close')) {
                commentsContainer.classList.remove('comments-container-close');
                commentsContainer.classList.add('comments-container-open');
            } else {
                commentsContainer.classList.remove('comments-container-open');
                commentsContainer.classList.add('comments-container-close');
            }
        }
        return;

    } catch (error) {
        showErrorMessage(error);
    }
};

async function deleteComment(commentId) {
    const commentsUpdated = await handleFetchData({
        action: "comments-delete",
        id: commentId,
    });

    if(commentsUpdated.success) {
        const commentToDelete = document.getElementById(`comment-card-${commentId}`)
        commentToDelete.remove()
    }
};

async function editComment(postId, commentId) {
// Obtenemos el valor actual
  const commentContent = document.getElementById(`content-${commentId}`);
  const valor = commentContent.textContent;

  // Creamos un div para incluir el input y el boton
  const newActionContainer = document.createElement("div");
  newActionContainer.id = `actions-content-${commentId}`;
  newActionContainer.classList.add("display-flex")


  const input = document.createElement("input");
  input.type = "text";
  input.id = `input-content-${commentId}`;
  input.value = valor;

  const updateButton = document.createElement("button");
  updateButton.classList.add("button")
  updateButton.classList.add("button-primary")
  updateButton.textContent = "Enviar";
  updateButton.onclick = () => updateComment(postId, commentId, input.value);

  const cancelButton = document.createElement("button");
  cancelButton.classList.add("button")
  cancelButton.classList.add("button-secondary")
  cancelButton.textContent = "Cancelar";
  cancelButton.onclick = () => changeInputToParagraph(commentId, valor);

  newActionContainer.innerHTML = "";
  newActionContainer.appendChild(input); 
  newActionContainer.appendChild(updateButton); 
  newActionContainer.appendChild(cancelButton); 

  // Sustituimos elementos:
  commentContent.parentNode.replaceChild(newActionContainer, commentContent)
};

async function updateComment(postId, commentId, content) {

    if(content.trim()) {
        if(!checkValidContent(content).success) {
            const message = checkValidContent(content).message
            showErrorMessage(message);
            return;
        }
        
        const commentsUpdated = await handleFetchData({
            action: "comments-update",
            commentId: commentId,
            content: content,
            postId: postId,
        });

        // Cambiamos el input por un p
        if(commentsUpdated.success) {
            changeInputToParagraph(commentId)
        }
    }
}

function changeInputToParagraph(commentId, value = '') {
    const actionsContainer = document.getElementById(`actions-content-${commentId}`);
    const input = document.getElementById(`input-content-${commentId}`);
    const valor = value || input.value;

    const parrafo = document.createElement("p");
    parrafo.textContent = valor;
    parrafo.id = `content-${commentId}`;
    parrafo.classList.add('content');

    actionsContainer.parentNode.replaceChild(parrafo, actionsContainer)
}

document.getElementById("add-post-button").addEventListener("click", () => {
    const modal = document.getElementById("editPostModal");
    document.getElementById("modalPostTitle").value = '';
    document.getElementById("modalPostContent").value = '';
    document.getElementById("modalPostId").value = '';
    document.querySelector("h2").textContent = 'Añadir Post';
    document.getElementById("modalPostSave").textContent = 'Crear';

    const select = document.getElementById("modalPostType");
    select.innerHTML = '';

    Object.entries(tipos).forEach(([valor, texto]) => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = texto;
        select.appendChild(option);
    });

    modal.style.display = "block";
});