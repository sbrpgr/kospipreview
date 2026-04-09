import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const CONTACT_TITLE = "문의";
const CONTACT_DESCRIPTION =
  "KOSPI Dawn 서비스 문의 접수 방법, 처리 기준, 응답 범위 안내입니다.";

export const metadata: Metadata = {
  title: CONTACT_TITLE,
  description: CONTACT_DESCRIPTION,
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: `${CONTACT_TITLE} | ${SITE_NAME}`,
    description: CONTACT_DESCRIPTION,
    url: toAbsoluteUrl("/contact"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${CONTACT_TITLE} | ${SITE_NAME}`,
    description: CONTACT_DESCRIPTION,
  },
};

const CONTACT_EMAIL = "ytbtheguy@gmail.com";

export default async function ContactPage() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main className="prose">
        <h2 className="sectionTitle">문의 안내</h2>
        <p>
          KOSPI Dawn 서비스 문의는 이메일 단일 채널로 접수받습니다. 요청하신 운영 원칙에 따라 전화, 메신저, SNS DM,
          댓글 기반 상담은 별도 운영하지 않으며, 공식 문의는 아래 이메일 주소로만 처리됩니다. 단일 채널 정책을 유지하는
          이유는 문의 이력 관리의 일관성, 답변 품질 통일, 보안 이슈 대응의 신속성을 확보하기 위함입니다.
        </p>

        <h3>공식 문의 이메일</h3>
        <p>
          <strong>{CONTACT_EMAIL}</strong>
        </p>

        <h3>1. 접수 가능 문의 범위</h3>
        <p>
          데이터 갱신 이상, 화면 표시 오류, 예측값 반영 지연, 기록 표기 불일치, 페이지 접속 문제, 도메인/배포 관련 문의,
          개인정보 처리 관련 요청, 운영정책 관련 의견 등을 접수할 수 있습니다. 단순 시장 전망 요청이나 개별 종목 매수·매도
          추천과 같은 투자자문 성격의 문의는 서비스 목적과 맞지 않아 답변 범위에서 제외될 수 있습니다.
        </p>

        <h3>2. 빠른 처리를 위한 작성 가이드</h3>
        <p>
          문의 메일 제목에는 문제 유형을 명확히 적어주세요. 예: "데이터 갱신 지연", "모바일 레이아웃 오류", "광고 표시 이슈".
          본문에는 발생 일시(한국시간), 접속 URL, 사용 기기/브라우저, 확인한 증상, 재현 방법을 함께 적으면 처리 속도가
          크게 빨라집니다. 화면 문제는 캡처를 첨부하면 원인 파악에 도움이 됩니다.
        </p>

        <h3>3. 응답 우선순위와 예상 시간</h3>
        <p>
          보안 사고 가능성, 서비스 중단, 데이터 무결성 훼손 가능성이 있는 이슈를 가장 높은 우선순위로 처리합니다. 그다음은
          핵심 기능 오류, 마지막으로 개선 제안·일반 문의 순으로 검토합니다. 문의량과 이슈 난이도에 따라 답변 시간이 달라질
          수 있으나, 접수 확인 후 처리 상태를 가능한 범위에서 안내합니다. 복잡한 장애는 원인 분석과 재발 방지 계획까지
          포함해 후속 안내를 드립니다.
        </p>

        <h3>4. 개인정보 및 보안 관련 문의</h3>
        <p>
          개인정보 열람·정정·삭제 요청, 처리정지 요청, 보안 취약점 신고는 제목에 [개인정보] 또는 [보안신고]를 명시해 주세요.
          보안 이슈는 공개 게시 대신 이메일 비공개 채널로 접수해 주셔야 사용자 보호와 신속한 조치가 가능합니다. 취약점
          신고에는 영향 범위, 재현 절차, 예상 리스크를 포함해 주시면 검증과 패치에 큰 도움이 됩니다.
        </p>

        <h3>5. 운영상 제한 및 안내</h3>
        <p>
          본 서비스는 정보 제공 플랫폼으로, 투자 손익에 대한 책임 보장이나 수익 약속을 하지 않습니다. 따라서 특정 수익률
          보장 요청, 개별 계좌 전략 자문, 비공개 내부 데이터 제공 요청은 응답이 제한될 수 있습니다. 또한 폭언, 반복 스팸,
          악의적 자동 요청 등은 서비스 보호를 위해 차단될 수 있습니다.
        </p>

        <h3>6. 커뮤니케이션 원칙</h3>
        <p>
          KOSPI Dawn 팀은 정확하고 재현 가능한 답변을 우선합니다. 즉시 답변보다 정확한 원인 파악을 목표로 하며, 임시 조치와
          영구 조치를 구분해 안내합니다. 필요 시 "현재 상황", "임시 우회방법", "완료 예정 조치"를 단계별로 공유하여
          사용자가 불확실성을 줄이고 서비스 상태를 이해할 수 있도록 돕겠습니다.
        </p>

        <h3>7. 메일 보안 및 회신 유의사항</h3>
        <p>
          문의 메일에는 계좌번호, 비밀번호, 인증코드, 개인식별번호 등 민감정보를 포함하지 마시기 바랍니다. 운영팀은 이러한
          정보 제출을 요구하지 않으며, 요청하더라도 응답하지 않습니다. 회신은 공식 이메일 스레드 내에서만 진행되며, 링크 클릭
          또는 파일 실행을 유도하는 의심 메시지는 피싱일 수 있으니 주의해 주세요. 발신자 주소와 제목 형식을 반드시 확인하고,
          의심되는 답신을 받은 경우 같은 스레드로 재확인 메일을 보내 진위를 검증하시기 바랍니다. 안전한 문의 채널 운영은
          사용자 보호를 위한 기본 조건이며, 플랫폼 역시 동일 원칙을 지속적으로 준수하겠습니다.
        </p>
      </main>
    </div>
  );
}
