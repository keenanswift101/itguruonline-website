# Client Registration Form — Field Reference

> Based on: IT-Guru Online - Client Registration Form (New).pdf

## Form Sections

### Section A — Applicant Information

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | text | Yes | First name |
| Surname | text | Yes | Last name |
| ID/Passport Number | text | Yes | SA ID or passport |
| Physical Address | textarea | Yes | Full street address |
| Postal Address | textarea | No | If different from physical |
| Telephone Number | tel | No | Landline |
| Fax Number | tel | No | Legacy field — consider hiding |
| Cell Phone Number | tel | Yes | Primary contact |
| Email Address | email | Yes | For account communications |

### Section B — Domain Details

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Domain Name | text | Yes | Auto-populated if coming from domain checker |
| Nameserver 1 | text | No | DNS settings — IT-Guru defaults if blank |
| Nameserver 2 | text | No | DNS settings — IT-Guru defaults if blank |

### Section C — Service Selection

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Web Hosting Package | select | Yes | Package tiers TBD |
| Domain Registration | checkbox | Yes | .co.za, .com, .net, .org, .online |
| SSL Certificate | checkbox | No | Recommended |
| Email Hosting | checkbox | No | Business email setup |
| Website Design | checkbox | No | Via Swift Designz partnership |
| Additional Services | textarea | No | Free-form notes |

### Section D — Declaration

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Terms Acceptance | checkbox | Yes | Must accept T&Cs |
| Digital Signature | signature-pad | Yes | Canvas-based or typed name |
| Date | date | Yes | Auto-populated |

## Form Flow

```
Domain Checker → Domain Available?
  ├── Yes → Pre-fill domain → Registration Form → Submit → Confirmation
  └── No → Show Alternatives → User selects → Pre-fill → Registration Form
```

## Validation Rules
- SA ID: 13 digits, Luhn check
- Email: Standard email validation
- Phone: SA format (+27... or 0...)
- Domain: Valid domain name characters, no spaces
- All required fields must be filled before submission
