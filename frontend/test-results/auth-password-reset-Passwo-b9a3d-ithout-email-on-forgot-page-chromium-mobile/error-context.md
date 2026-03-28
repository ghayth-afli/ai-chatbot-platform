# Page snapshot

```yaml
- generic [ref=e6]:
  - generic [ref=e8]:
    - img [ref=e10]
    - generic [ref=e14]:
      - generic [ref=e15]:
        - text: nexus
        - generic [ref=e16]: .
      - generic [ref=e17]: AI PLATFORM
  - generic [ref=e18]:
    - heading "Forgot password?" [level=1] [ref=e19]
    - paragraph [ref=e20]: auth.forgotPasswordDescription
  - generic [ref=e21]:
    - generic [ref=e22]:
      - generic [ref=e23]: Email Address*
      - textbox "name@example.com" [active] [ref=e24]
    - button "Send Reset Code" [ref=e25] [cursor=pointer]
  - generic [ref=e26]:
    - generic [ref=e27]: "💡 Tip:"
    - text: Check your spam folder if you don't see the email within a few minutes
  - link "← Back to Login" [ref=e29] [cursor=pointer]:
    - /url: /auth/login
```