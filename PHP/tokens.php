<?php
	require "../vendor/autoload.php";
	use Lcobucci\JWT\Builder;
	use Lcobucci\JWT\Signer\Hmac\Sha256;

	$secret= "<INSERT YOUR SECRET KEY>";
	$token= (new Builder())
				->setExpiration(86400)
				->set("device", $_POST["device"])
				->sign(new Sha256(), $secret)
				->getToken();
	echo $token;
?>