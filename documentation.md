# Issues

## Critical

**Ticket VAL-202: Date of Birth Validation**

- **Reporter**: Maria Garcia
- **Priority**: Critical
- **Description**: "I accidentally entered my birth date as 2025 and the system accepted it."
- **Impact**: Potential compliance issues with accepting minors

**Ticket VAL-206: Card Number Validation**

- **Reporter**: David Brown
- **Priority**: Critical
- **Description**: "System accepts invalid card numbers"
- **Impact**: Failed transactions and customer frustration

**Ticket VAL-208: Weak Password Requirements**

- **Reporter**: Security Team
- **Priority**: Critical
- **Description**: "Password validation only checks length, not complexity"
- **Impact**: Account security risks

**Ticket SEC-301: SSN Storage**

- **Reporter**: Security Audit Team
- **Priority**: Critical
- **Description**: "SSNs are stored in plaintext in the database"
- **Impact**: Severe privacy and compliance risk

**Ticket SEC-303: XSS Vulnerability**

- **Reporter**: Security Audit
- **Priority**: Critical
- **Description**: "Unescaped HTML rendering in transaction descriptions"
- **Impact**: Potential for cross-site scripting attacks

> TransactionList component was using a span with the dangerouslySetInnerHTML prop to render the description

> Solution: Replace with an embeded JSX string

> Since the description of the transaction is a plain string there is no need for Unescaped HTML rendering.

**Ticket PERF-401: Account Creation Error**

- **Reporter**: Support Team
- **Priority**: Critical
- **Description**: "New accounts show $100 balance when DB operations fail"
- **Impact**: Incorrect balance displays

> createAccount endpoint is returning a "pending" account object that defaults to a balance of $100

> Solution: Pending account object has a default balance of $0

> In the future more sensable defaults should be used and error cases should be checked.

**Ticket PERF-405: Missing Transactions**

- **Reporter**: Multiple Users
- **Priority**: Critical
- **Description**: "Not all transactions appear in history after multiple funding events"
- **Impact**: Users cannot verify all their transactions

**Ticket PERF-406: Balance Calculation**

- **Reporter**: Finance Team
- **Priority**: Critical
- **Description**: "Account balances become incorrect after many transactions"
- **Impact**: Critical financial discrepancies

> fundAccount endpoint had a loop that was adding 1/100 of the transaction amount to the balance 100 times instead of just adding the values

> Solution: Replace loop with simple add. Additionally, the number of db calls were reduced using Drizzle's .returning() function.

> In the future it's important to remember that simple solutions can help reduce issues.

**Ticket PERF-408: Resource Leak**

- **Reporter**: System Monitoring
- **Priority**: Critical
- **Description**: "Database connections remain open"
- **Impact**: System resource exhaustion

## High

**Ticket VAL-201: Email Validation Problems**

- **Reporter**: James Wilson
- **Priority**: High
- **Description**: "The system accepts invalid email formats and doesn't handle special cases properly."
- **Examples**:
  - Accepts "TEST@example.com" but converts to lowercase without notifying user
  - No validation for common typos like ".con" instead of ".com"

**Ticket VAL-205: Zero Amount Funding**

- **Reporter**: Lisa Johnson
- **Priority**: High
- **Description**: "I was able to submit a funding request for $0.00"
- **Impact**: Creates unnecessary transaction records

> FundingModal had amount input validation minimum set too low (0.0 vs 0.1). 
These requests were rejected on the backend because the amount input was set to positive but this provided a not user friendly error message.

> Solution: Set amount input minimum to 0.1 instead of 0.0

> In the future it should be noted that min is inclusive.

**Ticket VAL-207: Routing Number Optional**

- **Reporter**: Support Team
- **Priority**: High
- **Description**: "Bank transfers are being submitted without routing numbers"
- **Impact**: Failed ACH transfers

> routingNumber is optional in fundAccount endpoint input and FundingFormData type

> Solution: make routingNumber not optional

> In the future required fields should not be marked as optional

**Ticket VAL-210: Card Type Detection**

- **Reporter**: Support Team
- **Priority**: High
- **Description**: "Card type validation only checks basic prefixes, missing many valid cards"
- **Impact**: Valid cards being rejected

**Ticket SEC-302: Insecure Random Numbers**

- **Reporter**: Security Team
- **Priority**: High
- **Description**: "Account numbers generated using Math.random()"
- **Impact**: Potentially predictable account numbers

**Ticket SEC-304: Session Management**

- **Reporter**: DevOps Team
- **Priority**: High
- **Description**: "Multiple valid sessions per user, no invalidation"
- **Impact**: Security risk from unauthorized access

**Ticket PERF-403: Session Expiry**

- **Reporter**: Security Team
- **Priority**: High
- **Description**: "Expiring sessions still considered valid until exact expiry time"
- **Impact**: Security risk near session expiration

**Ticket PERF-407: Performance Degradation**

- **Reporter**: DevOps
- **Priority**: High
- **Description**: "System slows down when processing multiple transactions"
- **Impact**: Poor user experience during peak usage

## Medium

**Ticket UI-101: Dark Mode Text Visibility**

- **Reporter**: Sarah Chen
- **Priority**: Medium
- **Description**: "When using dark mode, the text I type into forms appears white on a white background, making it impossible to see what I'm typing."
- **Steps to Reproduce**:
  1. Enable dark mode
  2. Navigate to any input form
  3. Start typing
- **Expected**: Text should be clearly visible against the background
- **Actual**: Text is white on white background

> Dark mode is "enabled" by changing foreground and background color variables in globals.css but these values are not being used anywhere.

> Solution: Remove unused dark mode variables. Which prevents the text color from changing to unpredictable values.

> Future prevention: This solution should prevent this problem moving forward.

**Ticket VAL-203: State Code Validation**

- **Reporter**: Alex Thompson
- **Priority**: Medium
- **Description**: "The system accepted 'XX' as a valid state code."
- **Impact**: Address verification issues for banking communications

**Ticket VAL-204: Phone Number Format**

- **Reporter**: John Smith
- **Priority**: Medium
- **Description**: "International phone numbers aren't properly validated. The system accepts any string of numbers."
- **Impact**: Unable to contact customers for important notifications

**Ticket VAL-209: Amount Input Issues**

- **Reporter**: Robert Lee
- **Priority**: Medium
- **Description**: "System accepts amounts with multiple leading zeros"
- **Impact**: Confusion in transaction records

**Ticket PERF-402: Logout Issues**

- **Reporter**: QA Team
- **Priority**: Medium
- **Description**: "Logout always reports success even when session remains active"
- **Impact**: Users think they're logged out when they're not

**Ticket PERF-404: Transaction Sorting**

- **Reporter**: Jane Doe
- **Priority**: Medium
- **Description**: "Transaction order seems random sometimes"
- **Impact**: Confusion when reviewing transaction history
