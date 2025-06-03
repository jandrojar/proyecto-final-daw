<?php
    require_once("./model/utils.php");
	function get_posts_by_id($con, $id_post){
		$resultado = mysqli_query($con, "select * from post where id_post='$id_post';");
		return $resultado;
	};

	function get_posts_by_user_id($con, $id_user){
		$resultado = mysqli_query($con, "select p.id_post, p.tipo, p.titulo, p.contenido, p.fecha_creacion, p.fecha_modificacion, p.autor_id, u.nombre, u.apellidos, u.email, u.rol from post p join usuario u on p.autor_id = u.id_usuario where p.autor_id='$id_user';");
		return $resultado;
	};

	function get_posts_by_type($con, $type){
		$resultado = mysqli_query($con, "select p.id_post, p.tipo, p.titulo, p.contenido, p.fecha_creacion, p.fecha_modificacion, p.autor_id, u.nombre, u.apellidos, u.email, u.rol from post p join usuario u on p.autor_id = u.id_usuario where p.tipo='$type';");
		return $resultado;
	};

	function get_posts_by_type_and_user($con, $type, $user){
		$resultado = mysqli_query($con, "select p.id_post, p.tipo, p.titulo, p.contenido, p.fecha_creacion, p.fecha_modificacion, p.autor_id, u.nombre, u.apellidos, u.email, u.rol from post p join usuario u on p.autor_id = u.id_usuario where p.tipo='$type' and p.autor_id='$user';");
		return $resultado;
	};

	function get_posts($con){
		$resultado = mysqli_query($con, "select p.id_post, p.tipo, p.titulo, p.contenido, p.fecha_creacion, p.fecha_modificacion, p.autor_id, u.nombre, u.apellidos, u.email, u.rol from post p join usuario u on p.autor_id = u.id_usuario;");
		return $resultado;
	};

	function add_post($con, $titulo, $contenido, $tipo, $autor_id) {
		$fecha_actual = date("Y-m-d h:ia");
		$fecha_modificacion = '';
		$stmt = mysqli_prepare($con, "insert into post(tipo, titulo, contenido, fecha_creacion, fecha_modificacion, autor_id) values(?, ?, ?, ?, ?, ?)");
		mysqli_stmt_bind_param($stmt, "sssssi", $tipo, $titulo, $contenido, $fecha_actual, $fecha_modificacion, $autor_id, );
		return mysqli_stmt_execute($stmt);;
	}

	function delete_post($con, $id_post) {
		$stmt = mysqli_prepare($con, "delete from post where id_post= ?");
		mysqli_stmt_bind_param($stmt, "s", $id_post);
		mysqli_stmt_execute($stmt);

		if (mysqli_stmt_affected_rows($stmt) > 0) {
			return true;
		} else {
			return false;
		}
	}

	function update_post($con, $id, $titulo, $contenido, $tipo) {
		$fecha_modificacion = date("Y-m-d h:ia");
		$stmt = mysqli_prepare($con, "update post set titulo = ?, contenido = ?, tipo = ?, fecha_modificacion = ? where id_post = ?");
		mysqli_stmt_bind_param($stmt, "sssss", $titulo, $contenido, $tipo, $fecha_modificacion, $id);
		mysqli_stmt_execute($stmt);

		if (mysqli_stmt_affected_rows($stmt) > 0) {
			return array("success" => true, "message" => "Post actualizado correctamente");
		} else {
			return array("success" => false, "message" => "No se encontró el post para actualizar");
		}
	}



	function check_if_post_exists($con, $email_post) {
		$resultado = mysqli_query($con, "select * from post where email=$email_post");
		$num_filas = get_num_rows($resultado);

		if($num_filas == 0){
			return false;
		};
		return true;
	};
?>