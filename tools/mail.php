<?php defined('VALID') or die('Nuh-uh!');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require 'Exception.php';
require 'PHPMailer.php';
include 'SMTP.php';


  function sendmail($mail_to, $mail_subject, $mail_body) {

    $env = parse_ini_file("/var/www/configs/asciiarena.env");
    $mailhost   = @$env['MAILHOST']   ?: '';
    $mailuser = @$env['MAILUSER'] ?: '';
    $mailpass = @$env['MAILPASS'] ?: '';
    $mailport = @$env['MAILPORT'] ?: '';

    //Create an instance; passing `true` enables exceptions
    $mail = new PHPMailer(true);

    try {
        //Server settings
        $mail->isSMTP();                                            //Send using SMTP
        $mail->Host = $mailhost;
        $mail->Port       = $mailport;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->SMTPAuth   = true;
        $mail->Username   = $mailuser;
        $mail->Password   = $mailpass;

        //Recipients
        $mail->setFrom($mailuser, 'ASCII Arena');
        $mail->addAddress($mail_to);

        //Content
        $mail->isHTML(true);
        $mail->Subject = $mail_subject;
        $mail->Body    = $mail_body;

        $mail->send();
        $mail->smtpClose();
        //echo 'Message has been sent';
    } catch (Exception $e) {
        //echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    }
  }
