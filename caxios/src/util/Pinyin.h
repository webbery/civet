
#include <vector>
#include <string>

namespace caxios
{
    std::vector<std::string> decodeLocaleAlphabet(int64_t pinyinCode);
    bool IsChinese(wchar_t chr);
    std::vector<std::string> getLocaleAlphabet(wchar_t chr);

    std::wstring string2wstring(const std::string& str);
    std::string wstring2string(const std::wstring& str);
};
