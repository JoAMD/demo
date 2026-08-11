issues
1. only thing is, the steps could be centre justified, longer steps jut out to the right currently. minor issue only

2. Email preview - give template of OTS

2. example mjml for email, can defer to phase 3 but add this detail or ask me again 
<mjml><mj-body background-color="#ffffff"><mj-section padding="20px 30px 16px" css-class="nitro-email-section nitro-email-section--sec_f0dc3dff nitro-email-section-type--header">
    <mj-column><mj-image src="https://api.nitrosend.com/cdn/images/eyJfcmFpbHMiOnsiZGF0YSI6MzIwNSwicHVyIjoiYmxvYl9pZCJ9fQ==--cdf1947f984c4a176967258ceaa958aab636cfe5/small/brand_logo.png" width="120px" align="center" alt="OneTeam Services" padding="0" css-class="nitro-email-section nitro-email-section--sec_f0dc3dff nitro-email-section-type--header"></mj-image></mj-column>
  </mj-section>
<mj-section padding="0" css-class="nitro-email-section nitro-email-section--sec_7301c500 nitro-email-section-type--text">
    <mj-column><mj-text font-size="16px" color="#191716" padding="0px 30px 20px 30px" font-family="open sans, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" css-class="nitro-email-section nitro-email-section--sec_7301c500 nitro-email-section-type--text"><h1 style="font-family: open-sans-v2, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 28px; line-height: 1.08; margin-top: 0; margin-right: 0; margin-bottom: .65em; margin-left: 0">Welcome to OneTeam Services</h1><p style="margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; padding-bottom: 0">We're thrilled to have you here. OneTeam Services provides a dedicated cloud platform built for large consulting firms to collaborate effortlessly with clients and manage engagements. We also build bespoke software solutions focused on automation.</p></mj-text></mj-column>
  </mj-section>
<mj-section padding="0" css-class="nitro-email-section nitro-email-section--sec_81229779 nitro-email-section-type--button">
    <mj-column><mj-button background-color="#1163d0" color="#ffffff" align="center" font-size="16px" border-radius="0px" inner-padding="14px 32px" font-family="open sans, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="600" padding="0px 30px 20px 30px" css-class="nitro-email-section nitro-email-section--sec_81229779 nitro-email-section-type--button" href="https://www.oneteam.technology/">Explore Our Platform</mj-button></mj-column>
  </mj-section>
<mj-section padding="0px 20px 20px 20px" css-class="nitro-email-section nitro-email-section--sec_44289b0e nitro-email-section-type--footer">
    <mj-column><mj-text align="center" font-size="12px" color="#6d717a" font-family="open sans, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" css-class="nitro-email-section nitro-email-section--sec_44289b0e nitro-email-section-type--footer">
<p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin:0 0 8px 0">OneTeam Services</p>
<p style="margin:0 0 8px 0">OneTeam Services, 123 Main St, Suite 100, Austin, TX 73301</p>
<p style="margin:0"><a href="{{ unsubscribe_url }}" style="color:#6d717a;">Unsubscribe</a></p>
</mj-text></mj-column>
  </mj-section></mj-body></mjml>

3. if step failed, flow should stop there and rest of the steps should be unexecuted and gray and unclickable
