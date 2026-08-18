import { TemplateSectionType } from '../enums/template-section-type.enum';

export const SECTION_HTML: Record<string, string> = {
  [TemplateSectionType.COVER]: `
<section class="el-cover" style="background-image:url('{{coverImageUrl}}')">
  <div class="el-cover__overlay"></div>
  <div class="el-cover__inner">
    <p class="el-kicker">{{eventTitle}}</p>
    <h1 class="el-cover__names">{{brideName}} <span>&amp;</span> {{groomName}}</h1>
    <p class="el-cover__date">{{eventDate}}</p>
  </div>
</section>`,
  [TemplateSectionType.INVITE_HERO]: `
<section class="el-section el-invite">
  <p class="el-kicker">Trân trọng kính mời</p>
  <h2 class="el-invite__guest">{{guestName}}</h2>
  <p class="el-invite__msg">{{personalMessage}}</p>
</section>`,
  [TemplateSectionType.COUNTDOWN]: `
<section class="el-section el-countdown" data-event-date="{{eventDate}}">
  <p class="el-kicker">Đếm ngược ngày vui</p>
  <div class="el-countdown__row">
    <div><strong data-unit="days">0</strong><span>Ngày</span></div>
    <div><strong data-unit="hours">0</strong><span>Giờ</span></div>
    <div><strong data-unit="mins">0</strong><span>Phút</span></div>
    <div><strong data-unit="secs">0</strong><span>Giây</span></div>
  </div>
</section>`,
  [TemplateSectionType.COUPLE]: `
<section class="el-section el-couple">
  <p class="el-kicker">Cô dâu &amp; chú rể</p>
  <div class="el-couple__grid">
    <article>
      {{#if bridePhoto}}<img src="{{bridePhoto}}" alt="{{brideName}}" />{{/if}}
      <h3>{{brideName}}</h3>
      <p>{{brideBio}}</p>
    </article>
    <article>
      {{#if groomPhoto}}<img src="{{groomPhoto}}" alt="{{groomName}}" />{{/if}}
      <h3>{{groomName}}</h3>
      <p>{{groomBio}}</p>
    </article>
  </div>
</section>`,
  [TemplateSectionType.FAMILIES]: `
<section class="el-section el-families">
  <p class="el-kicker">{{familiesTitle}}</p>
  <div class="el-families__grid">
    <article>
      <h3>Nhà gái</h3>
      <p>Ông {{brideFather}}</p>
      <p>Bà {{brideMother}}</p>
      <p class="el-note">{{brideFamilyNote}}</p>
    </article>
    <article>
      <h3>Nhà trai</h3>
      <p>Ông {{groomFather}}</p>
      <p>Bà {{groomMother}}</p>
      <p class="el-note">{{groomFamilyNote}}</p>
    </article>
  </div>
</section>`,
  [TemplateSectionType.LOVE_STORY]: `
<section class="el-section el-story">
  <p class="el-kicker">Chuyện tình yêu</p>
  <div class="el-story__list">
    {{#each storyItems}}
    <article>
      <span>{{year}}</span>
      <h3>{{title}}</h3>
      <p>{{text}}</p>
    </article>
    {{/each}}
  </div>
</section>`,
  [TemplateSectionType.GALLERY]: `
<section class="el-section el-gallery">
  <p class="el-kicker">Album ảnh</p>
  <div class="el-gallery__grid">
    {{#each galleryImages}}
    <button type="button" class="el-gallery__item" data-src="{{this}}">
      <img src="{{this}}" alt="album" />
    </button>
    {{/each}}
  </div>
</section>`,
  [TemplateSectionType.EVENT_INFO]: `
<section class="el-section el-info">
  <p class="el-kicker">Thời gian &amp; địa điểm</p>
  <div class="el-info__grid">
    <article>
      <h3>Lễ cưới</h3>
      <p>{{ceremonyTime}}</p>
      <p>{{ceremonyVenue}}</p>
    </article>
    <article>
      <h3>Tiệc</h3>
      <p>{{receptionTime}}</p>
      <p>{{receptionVenue}}</p>
    </article>
  </div>
</section>`,
  [TemplateSectionType.MAP]: `
<section class="el-section el-map">
  <p class="el-kicker">Bản đồ</p>
  <p>{{mapQuery}}</p>
  <div class="el-map__frame">
    <iframe
      title="map"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      src="https://maps.google.com/maps?q={{mapQuery}}&output=embed"
    ></iframe>
  </div>
  <a class="el-btn" href="https://www.google.com/maps/search/?api=1&query={{mapQuery}}" target="_blank" rel="noreferrer">Chỉ đường</a>
</section>`,
  [TemplateSectionType.DRESS_CODE]: `
<section class="el-section el-dress">
  <p class="el-kicker">Dress code</p>
  <p>{{dressCode}}</p>
</section>`,
  [TemplateSectionType.WISHES]: `
<section class="el-section el-wishes">
  <p class="el-kicker">Lời từ cô dâu chú rể</p>
  <blockquote>{{coupleMessage}}</blockquote>
</section>`,
  [TemplateSectionType.GUESTBOOK]: `
<section class="el-section el-guestbook" id="guestbook">
  <p class="el-kicker">Sổ lời chúc</p>
  <p>Gửi lời chúc phúc đến {{brideName}} &amp; {{groomName}}</p>
</section>`,
  [TemplateSectionType.RSVP]: `
<section class="el-section el-rsvp" id="rsvp">
  <p class="el-kicker">Xác nhận tham dự</p>
  <p>Vui lòng RSVP bên dưới thiệp</p>
  <a class="el-btn" href="#rsvp-form">Xác nhận tham dự</a>
</section>`,
  [TemplateSectionType.FOOTER]: `
<footer class="el-section el-footer">
  {{#if qrCodeUrl}}<img class="el-footer__qr" src="{{qrCodeUrl}}" alt="QR" />{{/if}}
  <p>Cảm ơn bạn đã hiện diện</p>
  <p class="el-note">© {{currentYear}} EventLab</p>
</footer>`,
  [TemplateSectionType.AUDIO]: `
<section class="el-audio">
  {{#if audioUrl}}
  <audio controls src="{{audioUrl}}"></audio>
  {{/if}}
</section>`,
};

export const BASE_SECTION_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Source+Sans+3:wght@400;600&display=swap');
.el-invite-root {
  --el-primary: var(--el-primary-color, #c9a227);
  --el-bg: var(--el-background, #f7f0e8);
  --el-heading: var(--el-font-heading, "Playfair Display", serif);
  --el-body: var(--el-font-body, "Source Sans 3", sans-serif);
  background: var(--el-bg);
  color: #3d3228;
  font-family: var(--el-body);
  max-width: 480px;
  margin: 0 auto;
}
.el-kicker { letter-spacing: .18em; text-transform: uppercase; font-size: 11px; color: var(--el-primary); margin: 0 0 8px; }
.el-section { padding: 40px 24px; text-align: center; }
.el-note { color: #7a6a5c; font-size: 14px; }
.el-btn {
  display: inline-block; margin-top: 16px; padding: 10px 20px; border-radius: 999px;
  background: var(--el-primary); color: #fff; text-decoration: none; font-size: 14px;
}
.el-cover { position: relative; min-height: 640px; background-size: cover; background-position: center; color: #fff; }
.el-cover__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.15), rgba(40,24,12,.55)); }
.el-cover__inner { position: relative; z-index: 1; min-height: 640px; display: flex; flex-direction: column; justify-content: flex-end; padding: 48px 24px; }
.el-cover__names { font-family: var(--el-heading); font-size: 40px; margin: 8px 0; font-weight: 500; }
.el-cover__names span { font-size: 22px; }
.el-invite__guest { font-family: var(--el-heading); font-size: 28px; margin: 8px 0; }
.el-countdown__row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.el-countdown__row div { background: #fff; border-radius: 12px; padding: 12px 4px; }
.el-countdown__row strong { display: block; font-size: 22px; font-family: var(--el-heading); }
.el-countdown__row span { font-size: 11px; color: #7a6a5c; }
.el-couple__grid, .el-families__grid, .el-info__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center; }
.el-couple img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 16px; }
.el-couple h3, .el-families h3, .el-info h3 { font-family: var(--el-heading); margin: 12px 0 6px; }
.el-story__list { text-align: left; }
.el-story article { border-left: 2px solid var(--el-primary); padding: 0 0 20px 16px; }
.el-story span { color: var(--el-primary); font-size: 12px; }
.el-gallery__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.el-gallery__item { border: 0; padding: 0; background: none; }
.el-gallery img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; }
.el-map__frame { border-radius: 16px; overflow: hidden; height: 220px; margin: 12px 0; }
.el-map iframe { width: 100%; height: 100%; border: 0; }
.el-wishes blockquote { font-family: var(--el-heading); font-size: 22px; font-style: italic; margin: 0; }
.el-footer__qr { width: 96px; height: 96px; }
.el-audio { padding: 12px 24px; }
.el-lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.86); z-index: 40; align-items: center; justify-content: center; }
.el-lightbox.is-open { display: flex; }
.el-lightbox img { max-width: 92%; max-height: 92%; }
`;
