/**
 * 프로젝트 이름 → ascii 슬러그.
 *
 * 이 파일은 **손으로 쓴다.** 프로젝트 이름이 대부분 한글이라 자동 슬러그화는
 * 빈 문자열이나 퍼센트 인코딩을 낳는다. 슬러그는 이미지 파일명·`#앵커`·
 * `<details>` id에 함께 쓰이고, 덕분에 임포터 재실행이 바이트 단위로 결정적이다.
 *
 * 키는 `data.ts`의 `Career.projects` 항목과 문자 그대로 같아야 한다.
 * 임포터는 이 표를 **읽기만** 한다 — 없는 이름을 만나면 나열하며 실패한다.
 */
export const projectSlugs: Record<string, string> = {
  // 한샘
  'ERP 디자인 시스템 개발': 'erp-design-system',
  '홈퍼니싱 시공 PC/모바일 운영': 'homefurnishing-install',
  '한샘몰 디자인 시스템 운영 및 개발': 'hanssemmall-design-system',
  '외주 시공프로 관리 서비스 구축': 'site-visit-pro',
  'AS모바일 Hybrid 전환': 'as-mobile-hybrid',
  'MDS(기준정보시스템) 구축': 'mds',
  '통합기준정보 시스템구축(2단계-MDC통합)': 'mdc',
  'AS포탈(업무시스템) 넥사크로 → React 전환': 'as-portal',

  // 스토어링크
  '스토어링크 5.0 사이트 및 백오피스 재구축, 안정화 및 운영': 'storelink-5',
  '애드링크 시스템 신규 구축': 'adlink',
  '쿠팡 모니터링 시스템 신규 개발': 'coupang-monitoring',
  '유니비 시스템 유지보수': 'univi',
  '스토어링크 4.0 백오피스 기능개선 및 유지보수': 'storelink-4-backoffice',

  // 위메프오
  '위메프오 플러스 웹뷰 및 어드민 시스템 기능 개선 및 유지보수': 'wmpo-plus',
  '위메프오 POS 웹뷰 기능 개선 및 유지보수': 'wmpo-pos',
  '위메프오 앱 내 일부 웹뷰 시스템 기능 개선 및 유지보수': 'wmpo-app-webview',
  '위메프오 파트너스 서비스 기능 개선 및 유지보수': 'wmpo-partners',
  '위메프오 어드민 시스템 기능 개선 및 유지보수': 'wmpo-admin',

  // 이노팸
  '드론 영상 AI 분석 시스템 고도화 사업': 'drone-ai-analysis',
  '2020년도 창업성장기술개발사업 디딤돌 창업과제': 'startup-growth-2020',
  '서울산업진흥원 2020년도 테스트베드 서울 실증지원 사업': 'testbed-seoul-2020',
  '인공지능(AI) 학습용 데이터 구축 2차': 'ai-training-data-2',
  '국립공원공단 드론 영상 보관 및 처리 시스템 구축': 'knps-drone-archive',
  '항공안전기술원 2020년 드론 실증도시 구축 사업': 'drone-city-2020',
  '장기 체공형 태양광 드론과 인공지능을 이용한 산불 모니터링 플랫폼 개발':
    'solar-drone-wildfire',
  '국립공원공단 드론관리시스템 구축': 'knps-drone-management',
  '클라우드 기반의 드론 매핑 서비스 플랫폼 개발': 'cloud-drone-mapping',

  // 신한항업
  'KT 5G NMS 구축 사업': 'kt-5g-nms',
  '사내 공간정보 포털시스템 구축': 'gis-portal',
  '2018 항공사진 관리시스템 구축': 'aerial-photo-2018',

  // 공간정보기술
  '2018년 교통안전시설물관리시스템(T-GIS) 유지관리 및 기능개선 용역':
    'tgis-2018-maintenance',
  '서울시 2017년 교통안전시설물 관리시스템(T-GIS) 도로점용공사장 관리 기능':
    'tgis-seoul-2017',
  '광주광역시 도로 및 상하수도 관리시스템 고도화': 'gwangju-road-water',
  '대전광역시 교통안전시설물 관리시스템(T-GIS) 구축 용역': 'tgis-daejeon',
  '개발제한구역 항공사진판독시스템 재구축 및 서비스 확대': 'greenbelt-aerial',
  '서부발전 부동산영상정보 유지관리 용역': 'kowepo-estate-maintenance',
  '울산시 교통안전시설물 유지관리시스템 기능개선 및 유지보수 용역':
    'tgis-ulsan',
  '농지정보시스템 개발 및 정보화사업 발전방향 수립': 'farmland-info',
  '부동산 영상 정보 시스템 구축': 'estate-imagery',
  '교통지리정보시스템(TGIS) 기능개선 및 고도화 사업': 'tgis-cheongju',
};
