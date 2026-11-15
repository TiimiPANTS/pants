
import type { ReservationForm } from "../types/reservation";

// Validation errors for individual reservation fields
export type ValidationErrors = {
    firstName?: string;
    lastName?: string;
    email?: string;
};

// Validate customer details and return field specific error messages
export const validateReservationForm = (
    form: ReservationForm
): ValidationErrors => {
    const errors: ValidationErrors = {};
   
    // Allow letters, spaces, apostrophes and hyphens in names
    const namePattern = /^[\p{L} '-]+$/u;

    //Remove surrounding whitespace before validation
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    //Validate firstname
    if (!firstName) {
        errors.firstName = "First name is required.";
    } else if (firstName.length < 2) {
        errors.firstName = "First name must be at least 2 characters.";
    } else if (firstName.length > 50) {
        errors.firstName = "First name must be 50 characters or less.";
    } else if (!namePattern.test(firstName)) {
        errors.firstName = "First name can only contain letters.";
    }

    //Validate lastname
    if (!lastName) {
        errors.lastName = "Last name is required.";
    } else if (lastName.length < 2) {
        errors.lastName = "Last name must be at least 2 characters.";
    } else if (lastName.length > 50) {
        errors.lastName = "Last name must be 50 characters or less.";
    } else if (!namePattern.test(lastName)) {
        errors.lastName = "Last name can only contain letters.";
    }

    //Validate email
    if (!email) {
        errors.email = "Email is required.";
    } else if (email.length > 254) {
        errors.email = "Email must be 254 characters or less.";
    } else {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            errors.email = "Enter an email like name@example.com";
        }
    }

    return errors;
};
