// Design tokens extrase din web pentru paritate vizuală
export const lightTokens = {
  colors: {
    bg: '#f3f5f6',
    surface: '#ffffff',
    elev: '#ffffff',
    border: '#e0e0e0',
    text: '#1f2937',
    muted: '#666666',
    placeholder: '#aaa',
    primary: '#355070',
    primaryHover: '#2a4059',
    primaryContrast: '#ffffff',
  },
  radius: { sm: 6, md: 8, lg: 12, pill: 999 },
  spacing: { xs:4, sm:8, md:12, lg:16, xl:24 },
  shadow: {
    elev1: { shadowColor:'#000', shadowOpacity:0.06, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
    elev2: { shadowColor:'#000', shadowOpacity:0.12, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:4 },
  }
};

export const darkTokens = {
  colors: {
    bg: '#121212',
    surface: '#282828',
    elev: '#2e2e2e',
    border: '#3f3f3f',
    text: '#eceeef',
    muted: '#8b8b8b',
    placeholder: '#8b8b8b',
    // Conform web index.css pentru dark mode (roz accent)
    primary: '#f51866',
    primaryHover: '#fa4875',
    primaryContrast: '#ffffff',
  },
  radius: { sm: 6, md: 8, lg: 12, pill: 999 },
  spacing: { xs:4, sm:8, md:12, lg:16, xl:24 },
  shadow: {
    elev1: { shadowColor:'#000', shadowOpacity:0.4, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
    elev2: { shadowColor:'#000', shadowOpacity:0.5, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:4 },
  }
};

export type Tokens = typeof lightTokens;
