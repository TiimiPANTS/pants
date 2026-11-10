package com.pants.backend.service;

import java.util.Optional;

import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(Optional<JavaMailSender> mailSender) {
        this.mailSender = mailSender.orElse(null);
    }

    public void sendHtmlEmail(String to, String subject, String html) {
        sendEmail(to, subject, html, null, null, null);
    }

    public void sendHtmlEmailWithInlineImage(
            String to,
            String subject,
            String html,
            String contentId,
            InputStreamSource image,
            String contentType) {
        sendEmail(to, subject, html, contentId, image, contentType);
    }

    private void sendEmail(
            String to,
            String subject,
            String html,
            String contentId,
            InputStreamSource image,
            String contentType) {
        if (mailSender == null) {
            System.out.println("Mailtrap not configured. Skipping email.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("pants@contact.com");
            helper.setText("HTML not supported", html);

            if (image != null) {
                helper.addInline(contentId, image, contentType);
            }

            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
