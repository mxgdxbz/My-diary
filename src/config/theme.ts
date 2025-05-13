import { extendTheme } from '@chakra-ui/react';

// 定义玻璃拟态主题
const theme = extendTheme({
  colors: {
    brand: {
      50: '#FDF0ED',  // 珊瑚粉超浅色
      100: '#F9DED7', // 珊瑚粉浅色
      200: '#F1C7BD', // 珊瑚粉中浅色 
      300: '#EDB9AD', // 珊瑚粉中色
      400: '#E9AFA3', // 珊瑚粉 - 主色调
      500: '#E39A8B', // 珊瑚粉加深
      600: '#CC7D6E', // 珊瑚粉深色
      700: '#B56151', // 珊瑚粉极深色
      800: '#96483A', // 褐色过渡
      900: '#7A3A2F', // 深褐色
    },
    neutrals: {
      50: '#FFFFFF',  // 纯白
      100: '#F9F9FA',
      200: '#F0F1F3',
      300: '#E6E8EC',
      400: '#D1D6DF',
      500: '#B7BEC9',
      600: '#8E99AA',
      700: '#646F83',
      800: '#3A405A', // 深海蓝
      900: '#1F2233', // 深蓝黑
    },
  },
  styles: {
    global: {
      body: {
        bg: 'neutrals.50', 
        color: 'neutrals.900',
        backgroundImage: 'url(/bg-pattern.png)', // 可选：添加微妙的背景图案
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === "teal" ? "brand.500" : 
               props.colorScheme === "gray" ? "neutrals.800" : undefined,
          color: "white",
          _hover: {
            bg: props.colorScheme === "teal" ? "brand.600" : 
                 props.colorScheme === "gray" ? "neutrals.900" : undefined,
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
          transition: 'all 0.2s',
        }),
        glass: {
          bg: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 'lg',
          color: 'neutrals.900',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.25)',
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
          transition: 'all 0.2s',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 'xl',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          transition: 'all 0.3s ease',
        },
      },
      variants: {
        glass: {
          container: {
            bg: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 'xl',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transition: 'all 0.3s ease',
            _hover: {
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
            },
          }
        }
      },
      defaultProps: {
        variant: 'glass',
      }
    },
    Input: {
      variants: {
        glass: {
          field: {
            bg: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 'md',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            _hover: {
              borderColor: 'brand.400',
            },
            _focus: {
              borderColor: 'brand.400',
              boxShadow: '0 0 0 1px #E9AFA3',
            },
          }
        }
      },
      defaultProps: {
        variant: 'glass',
      }
    },
    Textarea: {
      variants: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 'md',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          _hover: {
            borderColor: 'brand.400',
          },
          _focus: {
            borderColor: 'brand.400',
            boxShadow: '0 0 0 1px #E9AFA3',
          },
        }
      },
      defaultProps: {
        variant: 'glass',
      }
    },
    Box: {
      variants: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 'xl',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 'xl',
          boxShadow: 'xl',
        }
      }
    },
    Tabs: {
      variants: {
        'soft-rounded': {
          tab: {
            borderRadius: 'full',
            fontWeight: 'medium',
            _selected: {
              color: 'white',
              bg: 'brand.500',
            }
          }
        },
        enclosed: {
          tab: {
            _selected: {
              color: 'brand.700',
              borderColor: 'brand.500',
              borderBottomColor: 'white',
            }
          }
        },
        glass: {
          tab: {
            borderRadius: 'md',
            fontWeight: 'medium',
            bg: 'rgba(255, 255, 255, 0.3)',
            _selected: {
              color: 'white',
              bg: 'brand.500',
            }
          },
          tablist: {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            mb: '1em',
          }
        }
      },
    },
    Text: {
      baseStyle: {
        fontFamily: `'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`,
      },
      variants: {
        cursive: {
          fontFamily: `'Ma Shan Zheng', '尔雅趣宋体', cursive`,
        },
        leira: {
          fontFamily: `'Leira-Regular', 'Leira', cursive`,
        },
        forte: {
          fontFamily: `'Forte', cursive`,
        }
      }
    },
    Heading: {
      baseStyle: {
        fontFamily: `'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`,
      },
      variants: {
        cursive: {
          fontFamily: `'Ma Shan Zheng', '尔雅趣宋体', cursive`,
        },
        leira: {
          fontFamily: `'Leira-Regular', 'Leira', cursive`,
        },
        forte: {
          fontFamily: `'Forte', cursive`,
        }
      }
    }
  },
  fonts: {
    heading: `'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`,
    cursive: `'Ma Shan Zheng', '尔雅趣宋体', cursive`,
    leira: `'Leira-Regular', 'Leira', cursive`,
    forte: `'Forte', cursive`,
    bodoni: `'Bodoni MT', 'Bodoni', serif`,
  },
});

export default theme; 