type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
    twitter: (props: IconProps) => (
        <svg {...props} height="23" viewBox="0 0 1200 1227" width="23" xmlns="http://www.w3.org/2000/svg">
            <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
        </svg>
    ),
    gitHub: (props: IconProps) => (
        <svg viewBox="0 0 438.549 438.549" {...props}>
            <path
                fill="currentColor"
                d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
            ></path>
        </svg>
    ),
    spinner: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    ),
    webhook: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            id="mdi-webhook"
            viewBox="0 0 24 24"
            height="24"
            width="24"
            stroke="#f9fafb"
            {...props}
        >
            <path d="M10.46,19C9,21.07 6.15,21.59 4.09,20.15C2.04,18.71 1.56,15.84 3,13.75C3.87,12.5 5.21,11.83 6.58,11.77L6.63,13.2C5.72,13.27 4.84,13.74 4.27,14.56C3.27,16 3.58,17.94 4.95,18.91C6.33,19.87 8.26,19.5 9.26,18.07C9.57,17.62 9.75,17.13 9.82,16.63V15.62L15.4,15.58L15.47,15.47C16,14.55 17.15,14.23 18.05,14.75C18.95,15.27 19.26,16.43 18.73,17.35C18.2,18.26 17.04,18.58 16.14,18.06C15.73,17.83 15.44,17.46 15.31,17.04L11.24,17.06C11.13,17.73 10.87,18.38 10.46,19M17.74,11.86C20.27,12.17 22.07,14.44 21.76,16.93C21.45,19.43 19.15,21.2 16.62,20.89C15.13,20.71 13.9,19.86 13.19,18.68L14.43,17.96C14.92,18.73 15.75,19.28 16.75,19.41C18.5,19.62 20.05,18.43 20.26,16.76C20.47,15.09 19.23,13.56 17.5,13.35C16.96,13.29 16.44,13.36 15.97,13.53L15.12,13.97L12.54,9.2H12.32C11.26,9.16 10.44,8.29 10.47,7.25C10.5,6.21 11.4,5.4 12.45,5.44C13.5,5.5 14.33,6.35 14.3,7.39C14.28,7.83 14.11,8.23 13.84,8.54L15.74,12.05C16.36,11.85 17.04,11.78 17.74,11.86M8.25,9.14C7.25,6.79 8.31,4.1 10.62,3.12C12.94,2.14 15.62,3.25 16.62,5.6C17.21,6.97 17.09,8.47 16.42,9.67L15.18,8.95C15.6,8.14 15.67,7.15 15.27,6.22C14.59,4.62 12.78,3.85 11.23,4.5C9.67,5.16 8.97,7 9.65,8.6C9.93,9.26 10.4,9.77 10.97,10.11L11.36,10.32L8.29,15.31C8.32,15.36 8.36,15.42 8.39,15.5C8.88,16.41 8.54,17.56 7.62,18.05C6.71,18.54 5.56,18.18 5.06,17.24C4.57,16.31 4.91,15.16 5.83,14.67C6.22,14.46 6.65,14.41 7.06,14.5L9.37,10.73C8.9,10.3 8.5,9.76 8.25,9.14Z" />
        </svg>
    ),
    connection: (props: IconProps) => (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M16.3696 15.1309C16.2883 15.0496 16.1918 14.985 16.0856 14.941C15.9793 14.897 15.8655 14.8743 15.7505 14.8743C15.6355 14.8743 15.5216 14.897 15.4154 14.941C15.3092 14.985 15.2127 15.0496 15.1314 15.1309L13.1255 17.138L10.8625 14.875L12.8695 12.8691C13.0337 12.7049 13.126 12.4822 13.126 12.25C13.126 12.0178 13.0337 11.7951 12.8695 11.6309C12.7054 11.4668 12.4827 11.3745 12.2505 11.3745C12.0183 11.3745 11.7956 11.4668 11.6314 11.6309L9.62549 13.638L7.61955 11.6309C7.45536 11.4668 7.23268 11.3745 7.00049 11.3745C6.76829 11.3745 6.54561 11.4668 6.38142 11.6309C6.21724 11.7951 6.125 12.0178 6.125 12.25C6.125 12.4822 6.21724 12.7049 6.38142 12.8691L7.07596 13.5625L4.52533 16.112C4.20024 16.437 3.94236 16.8229 3.76642 17.2476C3.59048 17.6723 3.49992 18.1275 3.49992 18.5872C3.49992 19.0469 3.59048 19.5021 3.76642 19.9268C3.94236 20.3515 4.20024 20.7373 4.52533 21.0623L5.11377 21.6497L2.00642 24.7559C1.92513 24.8372 1.86064 24.9337 1.81664 25.04C1.77265 25.1462 1.75 25.26 1.75 25.375C1.75 25.49 1.77265 25.6038 1.81664 25.71C1.86064 25.8163 1.92513 25.9128 2.00642 25.9941C2.17061 26.1582 2.39329 26.2505 2.62549 26.2505C2.74046 26.2505 2.8543 26.2278 2.96052 26.1838C3.06674 26.1398 3.16325 26.0754 3.24455 25.9941L6.3508 22.8867L6.93814 23.4752C7.26316 23.8002 7.64903 24.0581 8.07372 24.2341C8.49841 24.41 8.9536 24.5006 9.4133 24.5006C9.87299 24.5006 10.3282 24.41 10.7529 24.2341C11.1776 24.0581 11.5634 23.8002 11.8885 23.4752L14.438 20.9245L15.1314 21.6191C15.2127 21.7004 15.3092 21.7648 15.4155 21.8088C15.5217 21.8528 15.6355 21.8755 15.7505 21.8755C15.8655 21.8755 15.9793 21.8528 16.0855 21.8088C16.1917 21.7648 16.2883 21.7004 16.3696 21.6191C16.4508 21.5378 16.5153 21.4413 16.5593 21.335C16.6033 21.2288 16.626 21.115 16.626 21C16.626 20.885 16.6033 20.7712 16.5593 20.665C16.5153 20.5587 16.4508 20.4622 16.3696 20.3809L14.3625 18.375L16.3696 16.3691C16.4509 16.2878 16.5154 16.1913 16.5595 16.0851C16.6035 15.9789 16.6262 15.865 16.6262 15.75C16.6262 15.635 16.6035 15.5212 16.5595 15.4149C16.5154 15.3087 16.4509 15.2122 16.3696 15.1309ZM10.6503 22.2403C10.3222 22.5683 9.87723 22.7525 9.4133 22.7525C8.94937 22.7525 8.50442 22.5683 8.17627 22.2403L5.76345 19.8242C5.43551 19.4961 5.2513 19.0511 5.2513 18.5872C5.2513 18.1233 5.43551 17.6783 5.76345 17.3502L8.31299 14.7995L13.201 19.6875L10.6503 22.2403ZM25.9946 2.00594C25.9133 1.92458 25.8168 1.86005 25.7106 1.81601C25.6043 1.77198 25.4905 1.74931 25.3755 1.74931C25.2605 1.74931 25.1466 1.77198 25.0404 1.81601C24.9342 1.86005 24.8377 1.92458 24.7564 2.00594L21.6502 5.11328L21.0628 4.52485C20.4057 3.86963 19.5156 3.5017 18.5877 3.5017C17.6597 3.5017 16.7696 3.86963 16.1125 4.52485L13.563 7.07547L12.8695 6.38094C12.7054 6.21675 12.4827 6.12452 12.2505 6.12452C12.0183 6.12452 11.7956 6.21675 11.6314 6.38094C11.4672 6.54513 11.375 6.76781 11.375 7C11.375 7.2322 11.4672 7.45488 11.6314 7.61906L20.3814 16.3691C20.4627 16.4504 20.5592 16.5148 20.6655 16.5588C20.7717 16.6028 20.8855 16.6255 21.0005 16.6255C21.1155 16.6255 21.2293 16.6028 21.3355 16.5588C21.4417 16.5148 21.5383 16.4504 21.6196 16.3691C21.7008 16.2878 21.7653 16.1913 21.8093 16.085C21.8533 15.9788 21.876 15.865 21.876 15.75C21.876 15.635 21.8533 15.5212 21.8093 15.415C21.7653 15.3087 21.7008 15.2122 21.6196 15.1309L20.925 14.4375L23.4756 11.888C23.8007 11.563 24.0586 11.1771 24.2346 10.7524C24.4105 10.3277 24.5011 9.87251 24.5011 9.41281C24.5011 8.95312 24.4105 8.49793 24.2346 8.07324C24.0586 7.64855 23.8007 7.26267 23.4756 6.93766L22.8872 6.35031L25.9946 3.24406C26.0759 3.1628 26.1404 3.0663 26.1845 2.96007C26.2285 2.85385 26.2512 2.73999 26.2512 2.625C26.2512 2.51001 26.2285 2.39615 26.1845 2.28993C26.1404 2.18371 26.0759 2.0872 25.9946 2.00594ZM22.2375 10.6466L19.688 13.2005L14.8 8.3125L17.3506 5.76297C17.6788 5.43503 18.1237 5.25081 18.5877 5.25081C19.0516 5.25081 19.4965 5.43503 19.8247 5.76297L22.2375 8.16922C22.4009 8.33183 22.5305 8.52511 22.619 8.73796C22.7074 8.95081 22.753 9.17903 22.753 9.40953C22.753 9.64003 22.7074 9.86826 22.619 10.0811C22.5305 10.294 22.4009 10.4872 22.2375 10.6498V10.6466Z"
                fill="#2689FD"
            />
        </svg>
    ),
    request: (props: IconProps) => (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M4.72305 14C5.09386 14.305 5.39265 14.6882 5.59805 15.1222C6.12305 16.205 6.12305 17.5284 6.12305 18.8125C6.12305 21.4714 6.23242 22.75 8.74805 22.75C8.98011 22.75 9.20267 22.8422 9.36677 23.0063C9.53086 23.1704 9.62305 23.3929 9.62305 23.625C9.62305 23.8571 9.53086 24.0796 9.36677 24.2437C9.20267 24.4078 8.98011 24.5 8.74805 24.5C6.83617 24.5 5.54117 23.8284 4.89805 22.5028C4.37305 21.42 4.37305 20.0966 4.37305 18.8125C4.37305 16.1536 4.26367 14.875 1.74805 14.875C1.51598 14.875 1.29342 14.7828 1.12933 14.6187C0.965234 14.4546 0.873047 14.2321 0.873047 14C0.873047 13.7679 0.965234 13.5454 1.12933 13.3813C1.29342 13.2172 1.51598 13.125 1.74805 13.125C4.26367 13.125 4.37305 11.8464 4.37305 9.1875C4.37305 7.90562 4.37305 6.58 4.89805 5.49719C5.54336 4.17156 6.83836 3.5 8.75023 3.5C8.9823 3.5 9.20486 3.59219 9.36895 3.75628C9.53305 3.92038 9.62523 4.14294 9.62523 4.375C9.62523 4.60706 9.53305 4.82962 9.36895 4.99372C9.20486 5.15781 8.9823 5.25 8.75023 5.25C6.23461 5.25 6.12523 6.52859 6.12523 9.1875C6.12523 10.4694 6.12523 11.795 5.60023 12.8778C5.39421 13.312 5.09465 13.6952 4.72305 14ZM26.2502 13.125C23.7346 13.125 23.6252 11.8464 23.6252 9.1875C23.6252 7.90562 23.6252 6.58 23.1002 5.49719C22.4571 4.17156 21.1621 3.5 19.2502 3.5C19.0182 3.5 18.7956 3.59219 18.6315 3.75628C18.4674 3.92038 18.3752 4.14294 18.3752 4.375C18.3752 4.60706 18.4674 4.82962 18.6315 4.99372C18.7956 5.15781 19.0182 5.25 19.2502 5.25C21.7659 5.25 21.8752 6.52859 21.8752 9.1875C21.8752 10.4694 21.8752 11.795 22.4002 12.8778C22.6056 13.3118 22.9044 13.695 23.2752 14C22.9044 14.305 22.6056 14.6882 22.4002 15.1222C21.8752 16.205 21.8752 17.5284 21.8752 18.8125C21.8752 21.4714 21.7659 22.75 19.2502 22.75C19.0182 22.75 18.7956 22.8422 18.6315 23.0063C18.4674 23.1704 18.3752 23.3929 18.3752 23.625C18.3752 23.8571 18.4674 24.0796 18.6315 24.2437C18.7956 24.4078 19.0182 24.5 19.2502 24.5C21.1621 24.5 22.4571 23.8284 23.1002 22.5028C23.6252 21.42 23.6252 20.0966 23.6252 18.8125C23.6252 16.1536 23.7346 14.875 26.2502 14.875C26.4823 14.875 26.7049 14.7828 26.869 14.6187C27.033 14.4546 27.1252 14.2321 27.1252 14C27.1252 13.7679 27.033 13.5454 26.869 13.3813C26.7049 13.2172 26.4823 13.125 26.2502 13.125Z"
                fill="#2689FD"
            />
        </svg>
    ),
    ConnectedApp: (props: IconProps) => (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M8.75 4.375C7.88471 4.375 7.03885 4.63159 6.31938 5.11232C5.59992 5.59305 5.03916 6.27634 4.70803 7.07576C4.3769 7.87519 4.29026 8.75486 4.45907 9.60352C4.62788 10.4522 5.04456 11.2317 5.65641 11.8436C6.26826 12.4554 7.04782 12.8721 7.89648 13.0409C8.74515 13.2097 9.62481 13.1231 10.4242 12.792C11.2237 12.4608 11.9069 11.9001 12.3877 11.1806C12.8684 10.4612 13.125 9.61529 13.125 8.75C13.125 7.58968 12.6641 6.47688 11.8436 5.65641C11.0231 4.83594 9.91032 4.375 8.75 4.375ZM8.75 11.375C8.23083 11.375 7.72331 11.221 7.29163 10.9326C6.85995 10.6442 6.5235 10.2342 6.32482 9.75455C6.12614 9.27489 6.07415 8.74709 6.17544 8.23789C6.27673 7.72869 6.52673 7.26096 6.89385 6.89385C7.26096 6.52673 7.72869 6.27673 8.23789 6.17544C8.74709 6.07415 9.27489 6.12614 9.75455 6.32482C10.2342 6.5235 10.6442 6.85995 10.9326 7.29163C11.221 7.72331 11.375 8.23083 11.375 8.75C11.375 9.4462 11.0984 10.1139 10.6062 10.6062C10.1139 11.0984 9.4462 11.375 8.75 11.375ZM19.25 13.125C20.1153 13.125 20.9612 12.8684 21.6806 12.3877C22.4001 11.9069 22.9608 11.2237 23.292 10.4242C23.6231 9.62481 23.7097 8.74515 23.5409 7.89648C23.3721 7.04782 22.9554 6.26826 22.3436 5.65641C21.7317 5.04456 20.9522 4.62788 20.1035 4.45907C19.2549 4.29026 18.3752 4.3769 17.5758 4.70803C16.7763 5.03916 16.0931 5.59992 15.6123 6.31938C15.1316 7.03885 14.875 7.88471 14.875 8.75C14.875 9.91032 15.3359 11.0231 16.1564 11.8436C16.9769 12.6641 18.0897 13.125 19.25 13.125ZM19.25 6.125C19.7692 6.125 20.2767 6.27896 20.7084 6.56739C21.1401 6.85583 21.4765 7.2658 21.6752 7.74546C21.8739 8.22511 21.9258 8.75291 21.8246 9.26211C21.7233 9.77131 21.4733 10.239 21.1062 10.6062C20.739 10.9733 20.2713 11.2233 19.7621 11.3246C19.2529 11.4258 18.7251 11.3739 18.2455 11.1752C17.7658 10.9765 17.3558 10.6401 17.0674 10.2084C16.779 9.77669 16.625 9.26918 16.625 8.75C16.625 8.05381 16.9016 7.38613 17.3938 6.89385C17.8861 6.40156 18.5538 6.125 19.25 6.125ZM8.75 14.875C7.88471 14.875 7.03885 15.1316 6.31938 15.6123C5.59992 16.0931 5.03916 16.7763 4.70803 17.5758C4.3769 18.3752 4.29026 19.2549 4.45907 20.1035C4.62788 20.9522 5.04456 21.7317 5.65641 22.3436C6.26826 22.9554 7.04782 23.3721 7.89648 23.5409C8.74515 23.7097 9.62481 23.6231 10.4242 23.292C11.2237 22.9608 11.9069 22.4001 12.3877 21.6806C12.8684 20.9612 13.125 20.1153 13.125 19.25C13.125 18.0897 12.6641 16.9769 11.8436 16.1564C11.0231 15.3359 9.91032 14.875 8.75 14.875ZM8.75 21.875C8.23083 21.875 7.72331 21.721 7.29163 21.4326C6.85995 21.1442 6.5235 20.7342 6.32482 20.2545C6.12614 19.7749 6.07415 19.2471 6.17544 18.7379C6.27673 18.2287 6.52673 17.761 6.89385 17.3938C7.26096 17.0267 7.72869 16.7767 8.23789 16.6754C8.74709 16.5742 9.27489 16.6261 9.75455 16.8248C10.2342 17.0235 10.6442 17.36 10.9326 17.7916C11.221 18.2233 11.375 18.7308 11.375 19.25C11.375 19.9462 11.0984 20.6139 10.6062 21.1062C10.1139 21.5984 9.4462 21.875 8.75 21.875ZM23.625 19.25C23.625 19.4821 23.5328 19.7046 23.3687 19.8687C23.2046 20.0328 22.9821 20.125 22.75 20.125H20.125V22.75C20.125 22.9821 20.0328 23.2046 19.8687 23.3687C19.7046 23.5328 19.4821 23.625 19.25 23.625C19.0179 23.625 18.7954 23.5328 18.6313 23.3687C18.4672 23.2046 18.375 22.9821 18.375 22.75V20.125H15.75C15.5179 20.125 15.2954 20.0328 15.1313 19.8687C14.9672 19.7046 14.875 19.4821 14.875 19.25C14.875 19.0179 14.9672 18.7954 15.1313 18.6313C15.2954 18.4672 15.5179 18.375 15.75 18.375H18.375V15.75C18.375 15.5179 18.4672 15.2954 18.6313 15.1313C18.7954 14.9672 19.0179 14.875 19.25 14.875C19.4821 14.875 19.7046 14.9672 19.8687 15.1313C20.0328 15.2954 20.125 15.5179 20.125 15.75V18.375H22.75C22.9821 18.375 23.2046 18.4672 23.3687 18.6313C23.5328 18.7954 23.625 19.0179 23.625 19.25Z"
                fill="#2689FD"
            />
        </svg>
    ),
    copy: (props: IconProps) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M16.875 2.5H6.875C6.70924 2.5 6.55027 2.56585 6.43306 2.68306C6.31585 2.80027 6.25 2.95924 6.25 3.125V6.25H3.125C2.95924 6.25 2.80027 6.31585 2.68306 6.43306C2.56585 6.55027 2.5 6.70924 2.5 6.875V16.875C2.5 17.0408 2.56585 17.1997 2.68306 17.3169C2.80027 17.4342 2.95924 17.5 3.125 17.5H13.125C13.2908 17.5 13.4497 17.4342 13.5669 17.3169C13.6842 17.1997 13.75 17.0408 13.75 16.875V13.75H16.875C17.0408 13.75 17.1997 13.6842 17.3169 13.5669C17.4342 13.4497 17.5 13.2908 17.5 13.125V3.125C17.5 2.95924 17.4342 2.80027 17.3169 2.68306C17.1997 2.56585 17.0408 2.5 16.875 2.5ZM12.5 16.25H3.75V7.5H12.5V16.25ZM16.25 12.5H13.75V6.875C13.75 6.70924 13.6842 6.55027 13.5669 6.43306C13.4497 6.31585 13.2908 6.25 13.125 6.25H7.5V3.75H16.25V12.5Z"
                fill="white"
                fillOpacity="0.7"
            />
        </svg>
    ),
    success: (props: IconProps) => (
        <svg
            width="20"
            height="20"
            className="text-lime-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 16 12"
            {...props}
        >
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 5.917 5.724 10.5 15 1.5"
            />
        </svg>
    ),
    rocket: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
            />
        </svg>
    ),
    axe: (props: IconProps) => (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21241 0.192451C4.96635 0.027203 3.69937 0.129793 2.49613 0.493366C2.45243 0.50657 2.41075 0.525696 2.37224 0.550211C2.19539 0.662795 2.05215 0.820951 1.95757 1.00805C1.86299 1.19515 1.82058 1.40427 1.83478 1.61343C1.84899 1.82259 1.91929 2.02406 2.0383 2.19665C2.15731 2.36924 2.32062 2.50657 2.51107 2.59421C2.52654 2.60133 2.54236 2.60765 2.55848 2.61316C3.86618 3.05979 5.10063 3.69505 6.223 4.49808C6.14896 4.65344 6.10951 4.82472 6.10951 5.00001C6.10951 5.05734 6.11373 5.11424 6.122 5.1703L1.0592 10.2331C0.700211 10.5921 0.498535 11.079 0.498535 11.5867C0.498535 12.0943 0.700211 12.5812 1.0592 12.9402C1.41818 13.2992 1.90507 13.5009 2.41275 13.5009C2.92042 13.5009 3.4073 13.2992 3.76628 12.9402L8.82916 7.87799C8.88542 7.88633 8.94253 7.89058 9.00008 7.89058C9.17567 7.89058 9.34725 7.851 9.50283 7.77671C10.3058 8.8992 10.941 10.1338 11.3876 11.4416C11.3931 11.4579 11.3995 11.4738 11.4067 11.4895C11.4945 11.6796 11.6318 11.8427 11.8043 11.9615C11.9768 12.0803 12.178 12.1505 12.387 12.1647C12.5959 12.1789 12.8049 12.1366 12.9918 12.0422C13.1788 11.9478 13.3369 11.8049 13.4496 11.6283C13.4742 11.5897 13.4935 11.5478 13.5067 11.5039C13.8702 10.3007 13.9728 9.03374 13.8076 7.78769C13.6598 6.67377 13.3011 5.5995 12.7519 4.62197L12.887 4.48691L12.8905 4.48334C13.1042 4.26526 13.224 3.97205 13.224 3.66667C13.224 3.36129 13.1043 3.06807 12.8905 2.84999L11.1537 1.1131L11.1501 1.1096C10.932 0.895838 10.6388 0.776103 10.3334 0.776103C10.028 0.776103 9.73483 0.895838 9.51674 1.1096L9.37817 1.24817C8.40065 0.698917 7.32635 0.340178 6.21241 0.192451ZM11.7777 4.18198C11.7726 4.18685 11.7676 4.19182 11.7628 4.19687L9.26134 6.69831C9.24993 6.70872 9.2391 6.71956 9.22886 6.73079L9.11556 6.84409C9.08453 6.8739 9.04315 6.89058 9.00008 6.89058C8.97485 6.89058 8.9502 6.88486 8.92787 6.87412L8.91603 6.86783C8.90474 6.86124 8.89417 6.85329 8.8846 6.84409L7.15599 5.11548C7.14779 5.10694 7.14058 5.09762 7.13444 5.0877C7.13114 5.08113 7.12769 5.07461 7.12408 5.06816C7.11456 5.04692 7.10951 5.02372 7.10951 5.00001C7.10951 4.95694 7.12618 4.91556 7.15599 4.88454L7.26873 4.77179C7.27989 4.76161 7.29067 4.75085 7.30102 4.73951L9.80341 2.23712C9.80833 2.23239 9.81317 2.22755 9.81792 2.2226L10.2179 1.82259C10.249 1.79277 10.2903 1.7761 10.3334 1.7761C10.3765 1.7761 10.4179 1.79278 10.4489 1.82259L12.1775 3.55121C12.2073 3.58223 12.224 3.62361 12.224 3.66667C12.224 3.70975 12.2073 3.75113 12.1775 3.78216L11.7777 4.18198ZM10.2587 7.11515L12.0138 5.3601C12.4257 6.15924 12.6976 7.02479 12.8162 7.91915C12.9587 8.99369 12.8767 10.0858 12.5756 11.1264C12.5652 11.1354 12.5536 11.1432 12.5412 11.1495C12.5145 11.163 12.4846 11.169 12.4548 11.167C12.4249 11.165 12.3962 11.1549 12.3715 11.138C12.3516 11.1242 12.335 11.1064 12.3227 11.0856C11.8346 9.66666 11.1388 8.3287 10.2587 7.11515ZM1.7663 10.9402L6.6664 6.04011L7.95959 7.33333L3.05922 12.2331C2.88777 12.4045 2.65521 12.5009 2.41275 12.5009C2.17028 12.5009 1.93775 12.4046 1.7663 12.2331C1.59485 12.0617 1.49854 11.8291 1.49854 11.5867C1.49854 11.3442 1.59485 11.1117 1.7663 10.9402ZM6.88428 3.74201L8.64003 1.98629C7.84089 1.57439 6.97533 1.30238 6.08094 1.18377C5.00627 1.04125 3.91406 1.12339 2.87336 1.4246C2.86421 1.43506 2.85635 1.44666 2.85003 1.45918C2.83652 1.48591 2.83046 1.51578 2.83249 1.54566C2.83452 1.57555 2.84456 1.60433 2.86156 1.62898C2.87536 1.64899 2.89332 1.66568 2.91415 1.67796C4.333 2.16614 5.67084 2.86192 6.88428 3.74201Z"
                fill="white"
                fillOpacity="0.9"
            />
        </svg>
    ),
    plus: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-4"
            {...props}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    ),
    cross: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
            {...props}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    ),
    cog: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    ),
    codeblock: (props: IconProps) => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-6"
            {...props}
        >
            <path
                d="M3.64664 6.35375L1.64664 4.35375C1.60016 4.30731 1.56328 4.25216 1.53811 4.19147C1.51295 4.13077 1.5 4.0657 1.5 4C1.5 3.93429 1.51295 3.86922 1.53811 3.80853C1.56328 3.74783 1.60016 3.69268 1.64664 3.64625L3.64664 1.64625C3.74046 1.55243 3.86771 1.49972 4.00039 1.49972C4.13308 1.49972 4.26032 1.55243 4.35414 1.64625C4.44796 1.74007 4.50067 1.86731 4.50067 2C4.50067 2.13268 4.44796 2.25993 4.35414 2.35375L2.70727 4L4.35414 5.64625C4.44796 5.74007 4.50067 5.86731 4.50067 6C4.50067 6.13268 4.44796 6.25993 4.35414 6.35375C4.26032 6.44757 4.13308 6.50027 4.00039 6.50027C3.86771 6.50027 3.74046 6.44757 3.64664 6.35375ZM6.14664 6.35375C6.19308 6.40023 6.24822 6.43711 6.30892 6.46228C6.36962 6.48744 6.43469 6.50039 6.50039 6.50039C6.5661 6.50039 6.63116 6.48744 6.69186 6.46228C6.75256 6.43711 6.80771 6.40023 6.85414 6.35375L8.85414 4.35375C8.90063 4.30731 8.93751 4.25216 8.96267 4.19147C8.98784 4.13077 9.00079 4.0657 9.00079 4C9.00079 3.93429 8.98784 3.86922 8.96267 3.80853C8.93751 3.74783 8.90063 3.69268 8.85414 3.64625L6.85414 1.64625C6.76032 1.55243 6.63308 1.49972 6.50039 1.49972C6.36771 1.49972 6.24046 1.55243 6.14664 1.64625C6.05282 1.74007 6.00012 1.86731 6.00012 2C6.00012 2.13268 6.05282 2.25993 6.14664 2.35375L7.79352 4L6.14664 5.64625C6.10015 5.69268 6.06328 5.74783 6.03811 5.80853C6.01295 5.86922 6 5.93429 6 6C6 6.0657 6.01295 6.13077 6.03811 6.19147C6.06328 6.25216 6.10015 6.30731 6.14664 6.35375ZM12.5004 2.5H11.0004C10.8678 2.5 10.7406 2.55267 10.6468 2.64644C10.5531 2.74021 10.5004 2.86739 10.5004 3C10.5004 3.1326 10.5531 3.25978 10.6468 3.35355C10.7406 3.44732 10.8678 3.5 11.0004 3.5H12.5004V12.5H3.50039V8.5C3.50039 8.36739 3.44771 8.24021 3.35395 8.14644C3.26018 8.05267 3.133 8 3.00039 8C2.86779 8 2.74061 8.05267 2.64684 8.14644C2.55307 8.24021 2.50039 8.36739 2.50039 8.5V12.5C2.50039 12.7652 2.60575 13.0196 2.79329 13.2071C2.98082 13.3946 3.23518 13.5 3.50039 13.5H12.5004C12.7656 13.5 13.02 13.3946 13.2075 13.2071C13.395 13.0196 13.5004 12.7652 13.5004 12.5V3.5C13.5004 3.23478 13.395 2.98043 13.2075 2.79289C13.02 2.60535 12.7656 2.5 12.5004 2.5Z"
                fill="white"
            />
        </svg>
    ),
    check: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-check"
            {...props}
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    ),
    magnifyinglass: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-search"
            {...props}
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    ),
    trash: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-trash"
            {...props}
        >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
    ),
};

export {
    RocketLaunchIcon,
    AdjustmentsVerticalIcon,
    SquaresPlusIcon,
    KeyIcon,
    BookOpenIcon,
} from '@heroicons/react/24/outline';
