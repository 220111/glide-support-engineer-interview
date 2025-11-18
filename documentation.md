# SecureBank Bug Fix and Remediation Report

## Overview

This document details the investigation and resolution of several bugs reported in the SecureBank application. The focus was based on user impact, ticket priority, and ease of implementation. In addition to fixing the reported bugs, a comprehensive testing suite was added to verify the solutions and prevent regressions. Some general improvements have been made as well.

## General Improvements

 * Centralized Schemas: Created a lib/schemas.ts file to centralize Zod validation schemas. This improves maintainability and reusability.
 * Database Modifications: Added an additional index on the transaction table to improve retrieval speeds and ordering.
 * Unit & Integration Tests: Added comprehensive tests for the auth and account routers using Jest. These tests cover the bug fixes and new validation logic, ensuring that the fixes work as expected.


## User Ticket Reported Findings
(In order of completion)

**Ticket UI-101: Dark Mode Text Visibility**

 * **Root Cause**: Dark mode is "enabled" by changing foreground and background color variables in globals.css but these values are not being used anywhere.

 * **Solution**: Remove unused dark mode variables. Which prevents the text color from changing to unpredictable values.

 * **Preventative Measures**: This solution should prevent this problem moving forward.


**Ticket VAL-207: Routing Number Optional**

 * **Root Cause**: `routingNumber` is optional in fundAccount endpoint input and FundingFormData type.

 * **Solution**: Solution: make `routingNumber` not optional

 * **Preventive Measures**: In the future required fields should not be marked as optional.

 * **Update**: Update: This solution did not work correctly since `routingNumber` *will* be optional for credit cards.

 * **Revised Solution**: `routingNumber` is optional on the `fundAccount` input but should manually throw when the number is empty when a bank account type is submitted.

 * **Self Learning**: always test all cases when making a solution and not just the optimal case.

**Ticket VAL-205: Zero Amount Funding**

 * **Root Cause**: `FundingModal` had amount input validation minimum set too low (0.0 vs 0.01). These requests were rejected on the backend because the amount input was set to positive but this provided a not user friendly error message.

 * **Solution**: Set amount input minimum to 0.01 instead of 0.0.

 * **Preventive Measures**: In the future it should be noted that min is inclusive.

**Ticket PERF-401: Account Creation Error**

 * **Root Cause**: `createAccount` endpoint is returning a `pending` account object that defaults to a balance of `100`. This could be misleading to new account holders who think they just got a free `100` only for it to disappear when the account is created.

 * **Solution**: Pending account object now has a default balance of `0`.

 * **Preventive Measures**: In the future more sensible defaults should be used and error cases should be checked.

**Ticket SEC-303: XSS Vulnerability**

 * **Root Cause**: `TransactionList` component was using a span with the `dangerouslySetInnerHTML` prop to render the description. This can expose the site to XSS attacks.

 * **Solution**: Replace the span with an embedded JSX string.

 * **Preventive Measures**: Since the description of the transaction is a plain string there is no need for Unescaped HTML rendering.

**Ticket PERF-406: Balance Calculation**

 * **Root Cause**: `fundAccount` endpoint had a loop that was adding 1/100 of the transaction amount to the balance 100 times instead of just adding the values

 * **Solution**: Replace loop with simple add. Additionally, the number of db calls were reduced using Drizzle's .`returning()` function.

 * **Preventive Measures**: In the future it's important to remember that simple solutions can help reduce issues.

**Ticket PERF-405: Missing Transactions**

 * **Root Cause**: `getTransactions` endpoint has inefficient db calls in a loop that was effectively replicating a left join and fundAccount was returning the incorrect transaction which was resolved with `Ticket PERF-406`

 * **Solution**: replace `enrichedTranscations` with a left join to move complexity into a single db call.

 * **Preventive Measures**: Databases are built to handle more complicated queries with default functionality this is especially true with joins which are would require a linear operation.

**Ticket PERF-408: Resource Leak**

 * **Root Cause**: `initDb` function was creating new connections that it wasn't using and then never closing them.

 * **Solution**: Remove unnecessary db connections and verify the ones that exist are closed properly.

 * **Preventive Measures**: Db connections need to be closed when they're done being used. Drizzle should handle this with its connection but not others.

**Ticket PERF-404: Transaction Sorting**

 * **Root Cause**: Transactions were being returned without a set order.

 * **Solution**: Add an orderBy to the transaction query.

 * **Preventative Measures**: Ordered data should include an orderBy statement.

**Ticket VAL-209: Amount Input Issues**

 * **Root Cause**: Minor problem with amount field validation that allows for leading zeros. Gets parsed out for the backend but easy fix.

 * **Solution**: Update amount input validation to not allow for leading zeros.

**Ticket SEC-304: Session Management**

 * **Root Cause**: Sessions should be deleted from the db when new a new one is created.

 * **Solution**: delete a user's session from the db when a new one is created.

 * **Preventative Measures**: Since this is a banking app it is important that only the account owner is able to access their account which means only one session at a time.

**Ticket SEC-301: SSN Storage**

 * **Root Cause**: SSN is very sensitive data that should not be stored in plaintext. I am sure that this is not enough of a solution in the real world but it should be better in the case that somebody stole information out of the db.

 * **Solution**: Add salt and encrypt/decrypt functionality and encrypt the SSN before storing it in the db.

 * **Preventive Measures**: If you only needed to check that somebody was using the same SSN (as a security measure) then a one way hash could be better.

> **NOTE: I put an encryption key in the code just for interview purposes. In the real world this would not be done and would use just the environment variable.**

**Ticket SEC-302: Insecure Random Numbers**

 * **Root Cause**: Math.random() is not cryptographically secure and should not be used for sensitive information.

 * **Solution**: Replace Math.random() with node:crypto randomInt()

 * **Preventative Measures**: Sensitive information that should random and not be predictable should use random algorithms that are cryptographically secure.

**Ticket PERF-403: Session Expiry**

 * **Root Cause**: No system grace period so it will not invalidate sessions until exactly at expiry time

 * **Solution**: Add grace period for system so sessions that are about to become invalid in the next minute are invalidated.

**Ticket VAL-202: Date of Birth Validation**

 * **Root Cause**: the `dateOfBirth` field seems to be doing only string validation on both the frontend and the backend. No logical validation to ensure minors were not using the platform.

 * **Solution**: Use backend validation to check that the date is 18 years ago and in the past and use frontend validation to do the same for the user.

 * **Preventive Measures**: In the future validation should properly check for accurate types including more complicated ones like dates.

**Ticket VAL-210: Card Type Detection**

 * **Root Cause**: The basic prefix validation for credit card numbers misses many valid credit cards and there is a better solution for immediate validation.

 * **Solution**: Solution implement the luhn algorithm for frontend validation.

**Ticket VAL-206: Card Number Validation**

 * **Root Cause**: The backend system was doing no validation of credit card numbers to ensure they're correct.

 * **Solution**: Implement the Lunh algorithm to a simple check for invalid credit card numbers.

 * **Preventive Measures**: Ideally this would be backed by some sort of actual payment processing but this is still good validation to have for immediate failure cases.

**Ticket VAL-208: Weak Password Requirements**

 * **Root Cause**: Backend password validation only checked length and frontend only checked for length + 1 number + not in one of 3 common passwords.

 * **Solution**: Add more conditions onto passwords including: 1 number + 1 special character + 1 uppercase letter. Additionally these requirements were added to the backend.

**Ticket VAL-201: Email Validation Problems**

 * **Root Cause**: No email validation was being done at all on the frontend or backend.

 * **Solution**: Solution: Add email validation using zod to the frontend and backend.

 * **Preventive Measures**: Additionally I have refactored the frontend and backend validation using the react-hook-form zodResolver and a shared schema.

**Ticket PERF-407: Performance Degradation**

 * **Root Cause**: Viewing transactions loads all transactions for the account each time. Additionally these are always filtered on the account number and ordered by the creation date.

 * **Solution 1**: Add a database index on account number and creation date to increase retrieval times.

 * **Solution 2**: Paginate the transactions using a useInfinteQuery hook with a "load more" button do reduce retreaval of older transactions.

 * **Preventative Measures**: It's important to ensure that we're not loading more data than needed and to ensure that the database is setup for how it's being used most frequently.

**Ticket VAL-203: State Code Validation**

 * **Root Cause**: No validation on the `state` field on AccountCreation.

 * **Solution**: Update validation to match an enum of all vaild US state codes.

**Ticket VAL-204: Phone Number Format**

 * **Root Cause**: Only basic regex validation is being done on phone number.

 * **Solution**: Include libphonenumber-js to verify phone numbers are real US numbers.

 * **Extra Information Needed**: This ticket seems like it might be asking to use an international phone number but it requires a US address. Desired functionality should be verified here before allowing international numbers. 

**Ticket PERF-402: Logout Issues**

 * **Root Cause**: Errors with logout logic can allow cases where users logout and it only removes their client token but the session remains valid in the database.

 * **Solution**: Rewrite logout logic to properly remove session each time.
